"""
Students Models — MVC: Model Layer
"""
from django.db import models
from apps.accounts.models import User


class AcademicYear(models.Model):
    name       = models.CharField(max_length=20, unique=True)  # e.g. "2024-2025"
    start_date = models.DateField()
    end_date   = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'academic_years'
        ordering = ['-start_date']

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Program(models.Model):
    name        = models.CharField(max_length=200)
    code        = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    duration    = models.PositiveIntegerField(help_text='Duration in years')
    total_fee   = models.DecimalField(max_digits=12, decimal_places=2)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'programs'
        ordering = ['name']

    def __str__(self):
        return f'{self.code} – {self.name}'


class Student(models.Model):
    MALE   = 'male'
    FEMALE = 'female'
    OTHER  = 'other'

    GENDER_CHOICES = [(MALE, 'Male'), (FEMALE, 'Female'), (OTHER, 'Other')]

    ACTIVE      = 'active'
    INACTIVE    = 'inactive'
    GRADUATED   = 'graduated'
    SUSPENDED   = 'suspended'

    STATUS_CHOICES = [
        (ACTIVE,    'Active'),
        (INACTIVE,  'Inactive'),
        (GRADUATED, 'Graduated'),
        (SUSPENDED, 'Suspended'),
    ]

    # Link to auth user (optional — a student may not have login access)
    user           = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='student_profile'
    )
    student_number = models.CharField(max_length=20, unique=True)
    first_name     = models.CharField(max_length=100)
    last_name      = models.CharField(max_length=100)
    date_of_birth  = models.DateField()
    gender         = models.CharField(max_length=10, choices=GENDER_CHOICES)
    email          = models.EmailField(unique=True)
    phone          = models.CharField(max_length=20, blank=True)
    address        = models.TextField(blank=True)
    photo          = models.ImageField(upload_to='students/', null=True, blank=True)

    program        = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='students')
    academic_year  = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name='students')
    year_level     = models.PositiveIntegerField(default=1)

    is_registered  = models.BooleanField(default=False)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)

    # Guardian info
    guardian_name  = models.CharField(max_length=200, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)

    enrolled_at    = models.DateField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def fee_summary(self):
        from apps.fees.models import FeeRecord
        records = FeeRecord.objects.filter(student=self)
        total_due    = sum(r.total_fee   for r in records)
        total_paid   = sum(r.amount_paid for r in records)
        balance      = total_due - total_paid
        pct          = (total_paid / total_due * 100) if total_due > 0 else 0
        return {
            'total_due':  float(total_due),
            'total_paid': float(total_paid),
            'balance':    float(balance),
            'percentage': round(pct, 2),
        }

    def check_and_update_registration(self):
        """Auto-register the student once 60% of fees are paid."""
        from django.conf import settings
        summary = self.fee_summary
        threshold = getattr(settings, 'REGISTRATION_FEE_THRESHOLD', 0.60)
        if summary['total_due'] > 0:
            pct = summary['total_paid'] / summary['total_due']
            if pct >= threshold and not self.is_registered:
                self.is_registered = True
                self.save(update_fields=['is_registered'])
                return True
        return False

    def __str__(self):
        return f'{self.student_number} – {self.full_name}'
