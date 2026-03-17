"""
Courses Models — MVC: Model Layer
"""
from django.db import models
from apps.accounts.models import User
from apps.students.models import Program, AcademicYear, Student


class Course(models.Model):
    code        = models.CharField(max_length=20, unique=True)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    units       = models.PositiveIntegerField(default=3)
    program     = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')
    year_level  = models.PositiveIntegerField(default=1)
    teacher     = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='teaching_courses',
        limit_choices_to={'role': 'teacher'}
    )
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'courses'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} – {self.name}'


class Enrollment(models.Model):
    student       = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course        = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    grade         = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    enrolled_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'enrollments'
        unique_together = ['student', 'course', 'academic_year']

    def __str__(self):
        return f'{self.student} → {self.course}'
