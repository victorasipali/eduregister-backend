"""
Students Views — MVC: Controller Layer
"""
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsRegistrar, IsRegistrarOrTeacher
from .models import Student, Program, AcademicYear
from .serializers import (
    StudentListSerializer, StudentDetailSerializer,
    ProgramSerializer, AcademicYearSerializer,
)


# ─── Academic Year ────────────────────────────────────────────────────────────

class AcademicYearListCreateView(generics.ListCreateAPIView):
    queryset           = AcademicYear.objects.all()
    serializer_class   = AcademicYearSerializer
    permission_classes = [IsRegistrar]


class AcademicYearDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = AcademicYear.objects.all()
    serializer_class   = AcademicYearSerializer
    permission_classes = [IsRegistrar]


# ─── Programs ────────────────────────────────────────────────────────────────

class ProgramListCreateView(generics.ListCreateAPIView):
    queryset           = Program.objects.all()
    serializer_class   = ProgramSerializer
    permission_classes = [IsRegistrarOrTeacher]


class ProgramDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Program.objects.all()
    serializer_class   = ProgramSerializer
    permission_classes = [IsRegistrar]


# ─── Students ────────────────────────────────────────────────────────────────

class StudentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsRegistrarOrTeacher]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['first_name', 'last_name', 'student_number', 'email']
    ordering_fields    = ['last_name', 'enrolled_at', 'student_number']

    def get_serializer_class(self):
        return StudentDetailSerializer if self.request.method == 'POST' else StudentListSerializer

    def get_queryset(self):
        qs = Student.objects.select_related('program', 'academic_year').all()
        params = self.request.query_params

        if program := params.get('program'):
            qs = qs.filter(program_id=program)
        if year := params.get('academic_year'):
            qs = qs.filter(academic_year_id=year)
        if status := params.get('status'):
            qs = qs.filter(status=status)
        if registered := params.get('is_registered'):
            qs = qs.filter(is_registered=registered.lower() == 'true')

        return qs


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Student.objects.select_related('program', 'academic_year').all()
    serializer_class   = StudentDetailSerializer
    permission_classes = [IsRegistrarOrTeacher]


@api_view(['POST'])
@permission_classes([IsRegistrar])
def manual_register_student(request, pk):
    """POST /api/students/<pk>/register/ — manually register a student."""
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    student.is_registered = True
    student.save(update_fields=['is_registered'])
    return Response({'detail': 'Student registered successfully.', 'is_registered': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_fee_status(request, pk):
    """GET /api/students/<pk>/fee-status/ — fee summary for a student."""
    try:
        student = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(student.fee_summary)
