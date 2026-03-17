from django.urls import path
from . import views

urlpatterns = [
    path('types/',            views.FeeTypeListCreateView.as_view(),  name='fee-type-list'),
    path('types/<int:pk>/',   views.FeeTypeDetailView.as_view(),      name='fee-type-detail'),
    path('records/',          views.FeeRecordListCreateView.as_view(), name='fee-record-list'),
    path('records/<int:pk>/', views.FeeRecordDetailView.as_view(),    name='fee-record-detail'),
    path('payments/',         views.PaymentListCreateView.as_view(),  name='payment-list'),
    path('payments/<int:pk>/',views.PaymentDetailView.as_view(),      name='payment-detail'),
    path('analytics/',        views.fee_analytics,                    name='fee-analytics'),
]
