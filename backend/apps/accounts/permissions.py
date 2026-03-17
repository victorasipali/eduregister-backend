"""
Accounts Permissions — MVC: Controller Layer (access control)
"""
from rest_framework.permissions import BasePermission
from .models import User


class IsRegistrar(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.REGISTRAR


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.TEACHER


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.STUDENT


class IsRegistrarOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.REGISTRAR, User.TEACHER
        ]
