"""
Fees Models — MVC: Model Layer
Tracks school fees, payments (cash/card), and the 60% auto-registration rule.
"""
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.students.models import Student


class FeeType(models.Model):
    """Categories of fees: tuition, lab, library, etc."""
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table = 'fee_types'

    def __str__(self):
        return self.name


class FeeRecord(models.Model):
    """
    One FeeRecord per student per academic year.
    Tracks total amount due and how much has been paid.
    """
    UNPAID      = 'unpaid'
    PARTIAL     = 'partial'
    PAID        = 'paid'

    STATUS_CHOICES = [
        (UNPAID,   'Unpaid'),
        (PARTIAL,  'Partially Paid'),
        (PAID,     'Fully Paid'),
    ]

    student       = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fee_records')
    fee_type      = models.ForeignKey(FeeType, on_delete=models.PROTECT, related_name='records')
    academic_year = models.CharField(max_length=20)
    total_fee     = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid   = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default=UNPAID)
    due_date      = models.DateField()
    notes         = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fee_records'
        unique_together = ['student', 'fee_type', 'academic_year']
        ordering = ['-created_at']

    @property
    def balance(self):
        return self.total_fee - self.amount_paid

    @property
    def payment_percentage(self):
        if self.total_fee == 0:
            return 0
        return round(float(self.amount_paid) / float(self.total_fee) * 100, 2)

    def update_status(self):
        if self.amount_paid >= self.total_fee:
            self.status = self.PAID
        elif self.amount_paid > 0:
            self.status = self.PARTIAL
        else:
            self.status = self.UNPAID

    def __str__(self):
        return f'{self.student} – {self.fee_type} ({self.academic_year})'


class Payment(models.Model):
    """Individual payment transactions against a FeeRecord."""
    CASH = 'cash'
    CARD = 'card'

    METHOD_CHOICES = [
        (CASH, 'Cash'),
        (CARD, 'Card'),
    ]

    PENDING   = 'pending'
    COMPLETED = 'completed'
    FAILED    = 'failed'
    REFUNDED  = 'refunded'

    PAYMENT_STATUS = [
        (PENDING,   'Pending'),
        (COMPLETED, 'Completed'),
        (FAILED,    'Failed'),
        (REFUNDED,  'Refunded'),
    ]

    fee_record        = models.ForeignKey(FeeRecord, on_delete=models.CASCADE, related_name='payments')
    amount            = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method    = models.CharField(max_length=10, choices=METHOD_CHOICES)
    payment_status    = models.CharField(max_length=10, choices=PAYMENT_STATUS, default=COMPLETED)
    reference_number  = models.CharField(max_length=100, blank=True)
    receipt_number    = models.CharField(max_length=50, unique=True)

    # Card-specific fields (stored masked for security)
    card_last_four    = models.CharField(max_length=4, blank=True)
    card_type         = models.CharField(max_length=20, blank=True)  # Visa, Mastercard, etc.

    processed_by      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='processed_payments'
    )
    payment_date      = models.DateTimeField(auto_now_add=True)
    notes             = models.TextField(blank=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date']

    def save(self, *args, **kwargs):
        # Auto-generate receipt number
        if not self.receipt_number:
            import datetime, random, string
            ts  = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            rnd = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            self.receipt_number = f'REC-{ts}-{rnd}'
        super().save(*args, **kwargs)

        # Update the parent FeeRecord's amount_paid and status
        if self.payment_status == self.COMPLETED:
            record = self.fee_record
            total  = record.payments.filter(payment_status=self.COMPLETED).aggregate(
                total=__import__('django.db.models', fromlist=['Sum']).Sum('amount')
            )['total'] or 0
            record.amount_paid = total
            record.update_status()
            record.save(update_fields=['amount_paid', 'status', 'updated_at'])

            # Trigger 60% auto-registration check
            record.student.check_and_update_registration()

    def __str__(self):
        return f'{self.receipt_number} – {self.amount} ({self.payment_method})'
