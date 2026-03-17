"""
Fees Serializers — MVC: View Layer
"""
from rest_framework import serializers
from .models import FeeType, FeeRecord, Payment


class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeeType
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(
        source='processed_by.full_name', read_only=True
    )

    class Meta:
        model  = Payment
        fields = [
            'id', 'fee_record', 'amount', 'payment_method', 'payment_status',
            'reference_number', 'receipt_number', 'card_last_four', 'card_type',
            'processed_by', 'processed_by_name', 'payment_date', 'notes',
        ]
        read_only_fields = ['receipt_number', 'payment_date', 'processed_by']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate(self, attrs):
        fee_record = attrs.get('fee_record')
        amount     = attrs.get('amount', 0)
        if fee_record and amount > fee_record.balance:
            raise serializers.ValidationError({
                'amount': f'Amount exceeds balance of {fee_record.balance}.'
            })
        # Card payment must provide last four digits
        if attrs.get('payment_method') == Payment.CARD:
            if not attrs.get('card_last_four'):
                raise serializers.ValidationError({
                    'card_last_four': 'Card last four digits are required for card payments.'
                })
        return attrs

    def create(self, validated_data):
        validated_data['processed_by'] = self.context['request'].user
        return super().create(validated_data)


class FeeRecordSerializer(serializers.ModelSerializer):
    payments           = PaymentSerializer(many=True, read_only=True)
    balance            = serializers.ReadOnlyField()
    payment_percentage = serializers.ReadOnlyField()
    student_name       = serializers.CharField(source='student.full_name', read_only=True)
    student_number     = serializers.CharField(source='student.student_number', read_only=True)
    fee_type_name      = serializers.CharField(source='fee_type.name', read_only=True)

    class Meta:
        model  = FeeRecord
        fields = [
            'id', 'student', 'student_name', 'student_number',
            'fee_type', 'fee_type_name', 'academic_year',
            'total_fee', 'amount_paid', 'balance', 'payment_percentage',
            'status', 'due_date', 'notes', 'payments', 'created_at', 'updated_at',
        ]
        read_only_fields = ['amount_paid', 'status', 'created_at', 'updated_at']


class FeeRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeeRecord
        fields = ['student', 'fee_type', 'academic_year', 'total_fee', 'due_date', 'notes']
