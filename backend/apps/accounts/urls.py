from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/',         views.LoginView.as_view(),      name='login'),
    path('logout/',        views.LogoutView.as_view(),     name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(),     name='token-refresh'),
    path('register/',      views.RegisterUserView.as_view(),name='register-user'),
    path('me/',            views.MeView.as_view(),         name='me'),
    path('users/',         views.UserListView.as_view(),   name='user-list'),
    path('users/<int:pk>/',views.UserDetailView.as_view(), name='user-detail'),
    path('dashboard/',     views.dashboard_stats,          name='dashboard-stats'),
]
