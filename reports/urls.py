from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, GoogleLoginView

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
]
