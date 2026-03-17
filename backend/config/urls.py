"""
Root URL Configuration - Student Registration System
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',    include('apps.accounts.urls')),
    path('api/students/',include('apps.students.urls')),
    path('api/fees/',    include('apps.fees.urls')),
    path('api/courses/', include('apps.courses.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
