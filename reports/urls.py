from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, GoogleLoginView, AnalyzeView

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='reports')

urlpatterns = [
    path('analyze/', AnalyzeView.as_view(), name='analyze_image'),
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('', include(router.urls)),
]
