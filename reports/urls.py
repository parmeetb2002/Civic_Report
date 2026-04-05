from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, GoogleLoginView, AnalyzeView, UserListView, ToggleStaffStatusView, NotificationViewSet, ChatbotView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('analyze/', AnalyzeView.as_view(), name='analyze_image'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/toggle-staff/', ToggleStaffStatusView.as_view(), name='toggle-staff'),
    path('', include(router.urls)),
]
