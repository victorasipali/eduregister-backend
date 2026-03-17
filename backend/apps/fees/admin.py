from django.contrib import admin
from .models import FeeType, FeeRecord, Payment


@admin.register(FeeType)
class FeeTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active']


class PaymentInline(admin.TabularInline):
    model  = Payment
    extra  = 0
    readonly_fields = ['receipt_number', 'payment_date', 'processed_by']


@admin.register(FeeRecord)
class FeeRecordAdmin(admin.ModelAdmin):
    list_display   = ['student', 'fee_type', 'academic_year', 'total_fee',
                      'amount_paid', 'status', 'due_date']
    list_filter    = ['status', 'fee_type', 'academic_year']
    search_fields  = ['student__first_name', 'student__last_name', 'student__student_number']
    readonly_fields = ['amount_paid', 'status', 'created_at', 'updated_at']
    inlines        = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['receipt_number', 'fee_record', 'amount', 'payment_method',
                     'payment_status', 'payment_date', 'processed_by']
    list_filter   = ['payment_method', 'payment_status']
    search_fields = ['receipt_number', 'fee_record__student__first_name']
    readonly_fields = ['receipt_number', 'payment_date']
