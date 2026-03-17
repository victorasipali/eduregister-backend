"""
Fees Views — MVC: Controller Layer
"""
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q

from apps.accounts.permissions import IsRegistrar, IsRegistrarOrTeacher
from .models import FeeType, FeeRecord, Payment
from .serializers import (
    FeeTypeSerializer, FeeRecordSerializer,
    FeeRecordCreateSerializer, PaymentSerializer,
)


# ─── Fee Types ───────────────────────────────────────────────────────────────

class FeeTypeListCreateView(generics.ListCreateAPIView):
    queryset           = FeeType.objects.filter(is_active=True)
    serializer_class   = FeeTypeSerializer
    permission_classes = [IsRegistrar]


class FeeTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = FeeType.objects.all()
    serializer_class   = FeeTypeSerializer
    permission_classes = [IsRegistrar]


# ─── Fee Records ─────────────────────────────────────────────────────────────

class FeeRecordListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsRegistrarOrTeacher]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['student__first_name', 'student__last_name',
                          'student__student_number', 'academic_year']

    def get_serializer_class(self):
        return FeeRecordCreateSerializer if self.request.method == 'POST' else FeeRecordSerializer

    def get_queryset(self):
        qs = FeeRecord.objects.select_related(
            'student', 'fee_type'
        ).prefetch_related('payments').all()

        params = self.request.query_params
        if student := params.get('student'):
            qs = qs.filter(student_id=student)
        if status := params.get('status'):
            qs = qs.filter(status=status)
        if year := params.get('academic_year'):
            qs = qs.filter(academic_year=year)
        return qs


class FeeRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = FeeRecord.objects.select_related('student', 'fee_type') \
                                          .prefetch_related('payments').all()
    serializer_class   = FeeRecordSerializer
    permission_classes = [IsRegistrarOrTeacher]


# ─── Payments ────────────────────────────────────────────────────────────────

class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class   = PaymentSerializer
    permission_classes = [IsRegistrarOrTeacher]

    def get_queryset(self):
        qs = Payment.objects.select_related(
            'fee_record__student', 'processed_by'
        ).all()
        if student := self.request.query_params.get('student'):
            qs = qs.filter(fee_record__student_id=student)
        if method := self.request.query_params.get('method'):
            qs = qs.filter(payment_method=method)
        return qs


class PaymentDetailView(generics.RetrieveAPIView):
    queryset           = Payment.objects.select_related('fee_record__student', 'processed_by').all()
    serializer_class   = PaymentSerializer
    permission_classes = [IsAuthenticated]


# ─── Analytics ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsRegistrarOrTeacher])
def fee_analytics(request):
    """GET /api/fees/analytics/ — revenue + collection stats."""
    records = FeeRecord.objects.all()

    totals = records.aggregate(
        total_billed=Sum('total_fee'),
        total_collected=Sum('amount_paid'),
    )

    by_status = {
        s: records.filter(status=s).count()
        for s in ['unpaid', 'partial', 'paid']
    }

    by_method = Payment.objects.filter(
        payment_status=Payment.COMPLETED
    ).values('payment_method').annotate(
        count=Count('id'),
        total=Sum('amount'),
    )

    recent_payments = Payment.objects.filter(
        payment_status=Payment.COMPLETED
    ).select_related('fee_record__student', 'processed_by').order_by('-payment_date')[:10]

    return Response({
        'totals':          totals,
        'by_status':       by_status,
        'by_method':       list(by_method),
        'recent_payments': PaymentSerializer(recent_payments, many=True).data,
    })
