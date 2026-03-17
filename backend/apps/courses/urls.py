from django.urls import path
from . import views

urlpatterns = [
    path('',                      views.CourseListCreateView.as_view(),    name='course-list'),
    path('<int:pk>/',             views.CourseDetailView.as_view(),        name='course-detail'),
    path('enrollments/',          views.EnrollmentListCreateView.as_view(),name='enrollment-list'),
    path('enrollments/<int:pk>/', views.EnrollmentDetailView.as_view(),   name='enrollment-detail'),
]
