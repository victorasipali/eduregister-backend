"""
Courses Serializers — MVC: View Layer
"""
from rest_framework import serializers
from .models import Course, Enrollment


class CourseSerializer(serializers.ModelSerializer):
    teacher_name  = serializers.CharField(source='teacher.full_name', read_only=True)
    program_name  = serializers.CharField(source='program.name', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = '__all__'

    def get_student_count(self, obj):
        return obj.enrollments.count()


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name  = serializers.CharField(source='student.full_name', read_only=True)
    course_name   = serializers.CharField(source='course.name', read_only=True)
    course_code   = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model  = Enrollment
        fields = '__all__'
