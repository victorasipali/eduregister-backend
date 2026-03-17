"""
Students Serializers — MVC: View Layer
"""
from rest_framework import serializers
from .models import Student, Program, AcademicYear


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AcademicYear
        fields = '__all__'


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Program
        fields = '__all__'


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    full_name     = serializers.ReadOnlyField()
    program_name  = serializers.CharField(source='program.name', read_only=True)
    program_code  = serializers.CharField(source='program.code', read_only=True)
    academic_year = serializers.CharField(source='academic_year.name', read_only=True)
    fee_summary   = serializers.ReadOnlyField()

    class Meta:
        model  = Student
        fields = [
            'id', 'student_number', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'photo', 'gender', 'year_level', 'status',
            'program_name', 'program_code', 'academic_year',
            'is_registered', 'enrolled_at', 'fee_summary',
        ]


class StudentDetailSerializer(serializers.ModelSerializer):
    """Full serializer for create / update / retrieve."""
    full_name    = serializers.ReadOnlyField()
    fee_summary  = serializers.ReadOnlyField()
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model  = Student
        fields = '__all__'
        read_only_fields = ['student_number', 'is_registered', 'enrolled_at', 'updated_at']

    def create(self, validated_data):
        # Auto-generate student number
        import datetime
        year  = datetime.date.today().year
        count = Student.objects.filter(enrolled_at__year=year).count() + 1
        validated_data['student_number'] = f'STU-{year}-{count:04d}'
        return super().create(validated_data)
