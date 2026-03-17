from django.contrib import admin
from .models import Course, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'program', 'year_level', 'units', 'teacher', 'is_active']
    list_filter   = ['program', 'year_level', 'is_active']
    search_fields = ['code', 'name']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = ['student', 'course', 'academic_year', 'grade', 'enrolled_at']
    list_filter   = ['academic_year', 'course__program']
    search_fields = ['student__first_name', 'student__last_name', 'course__code']
