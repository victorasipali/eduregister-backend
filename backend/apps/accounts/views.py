"""
Accounts Views — MVC: Controller Layer
Handles authentication, user CRUD, and profile management.
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsRegistrar


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — returns JWT pair + user info."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'})
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterUserView(generics.CreateAPIView):
    """POST /api/auth/register/ — registrar creates users."""
    serializer_class   = UserCreateSerializer
    permission_classes = [IsRegistrar]


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — current user's profile."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """GET /api/auth/users/ — list all users (registrar only)."""
    serializer_class   = UserSerializer
    permission_classes = [IsRegistrar]

    def get_queryset(self):
        qs   = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs.order_by('-created_at')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/users/<id>/ — user management."""
    serializer_class   = UserSerializer
    permission_classes = [IsRegistrar]
    queryset           = User.objects.all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """GET /api/auth/dashboard/ — aggregated stats for the dashboard."""
    from apps.students.models import Student
    from apps.fees.models import FeeRecord

    stats = {
        'total_students':     Student.objects.count(),
        'registered_students': Student.objects.filter(is_registered=True).count(),
        'pending_registration': Student.objects.filter(is_registered=False).count(),
        'total_teachers':     User.objects.filter(role=User.TEACHER).count(),
        'total_fees_collected': FeeRecord.objects.filter(
            status=FeeRecord.PAID
        ).aggregate(total=__import__('django.db.models', fromlist=['Sum']).Sum('amount_paid'))['total'] or 0,
    }
    return Response(stats)
