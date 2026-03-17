from django.contrib import admin
from .models import Student, Program, AcademicYear


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display  = ['name', 'start_date', 'end_date', 'is_current']
    list_filter   = ['is_current']


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'duration', 'total_fee', 'is_active']
    list_filter   = ['is_active', 'duration']
    search_fields = ['name', 'code']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ['student_number', 'full_name', 'program', 'year_level',
                     'is_registered', 'status', 'enrolled_at']
    list_filter   = ['is_registered', 'status', 'program', 'academic_year']
    search_fields = ['student_number', 'first_name', 'last_name', 'email']
    readonly_fields = ['student_number', 'enrolled_at', 'updated_at']
