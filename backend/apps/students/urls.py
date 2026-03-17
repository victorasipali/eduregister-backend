from django.urls import path
from . import views

urlpatterns = [
    # Academic Years
    path('academic-years/',         views.AcademicYearListCreateView.as_view(), name='academic-year-list'),
    path('academic-years/<int:pk>/',views.AcademicYearDetailView.as_view(),     name='academic-year-detail'),

    # Programs
    path('programs/',               views.ProgramListCreateView.as_view(), name='program-list'),
    path('programs/<int:pk>/',      views.ProgramDetailView.as_view(),     name='program-detail'),

    # Students
    path('',                        views.StudentListCreateView.as_view(), name='student-list'),
    path('<int:pk>/',               views.StudentDetailView.as_view(),     name='student-detail'),
    path('<int:pk>/register/',      views.manual_register_student,         name='student-register'),
    path('<int:pk>/fee-status/',    views.student_fee_status,              name='student-fee-status'),
]
