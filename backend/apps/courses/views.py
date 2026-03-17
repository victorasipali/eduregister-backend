"""
Courses Views — MVC: Controller Layer
"""
from rest_framework import generics, filters
from apps.accounts.permissions import IsRegistrarOrTeacher, IsRegistrar
from .models import Course, Enrollment
from .serializers import CourseSerializer, EnrollmentSerializer


class CourseListCreateView(generics.ListCreateAPIView):
    queryset           = Course.objects.select_related('program', 'teacher').all()
    serializer_class   = CourseSerializer
    permission_classes = [IsRegistrarOrTeacher]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['code', 'name', 'program__name']


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Course.objects.all()
    serializer_class   = CourseSerializer
    permission_classes = [IsRegistrar]


class EnrollmentListCreateView(generics.ListCreateAPIView):
    queryset           = Enrollment.objects.select_related('student', 'course', 'academic_year').all()
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsRegistrar]

    def get_queryset(self):
        qs = super().get_queryset()
        if student := self.request.query_params.get('student'):
            qs = qs.filter(student_id=student)
        if course := self.request.query_params.get('course'):
            qs = qs.filter(course_id=course)
        return qs


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Enrollment.objects.all()
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsRegistrar]
