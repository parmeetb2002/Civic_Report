from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
import time

from .models import Report
from .serializers import ReportSerializer
from .services import get_gemini_report, get_osm_poi_density, calculate_priority

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)

        max_retries = 2
        for attempt in range(max_retries):
            try:
                # Verify the token with Google
                idinfo = id_token.verify_oauth2_token(
                    token, requests.Request(), settings.GOOGLE_OAUTH2_CLIENT_ID
                )
                
                email = idinfo['email']
                first_name = idinfo.get('given_name', '')
                last_name = idinfo.get('family_name', '')

                # Get or Create the user
                user, created = User.objects.get_or_create(username=email, defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name
                })

                # Issue JWT
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'email': user.email,
                        'is_staff': user.is_staff
                    }
                })

            except ValueError as e:
                # Handle clock skew: Token used too early
                if "Token used too early" in str(e) and attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return Response({'error': 'Invalid token', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'Backend Error', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Report.objects.all().order_by('-created_at')
        return Report.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        image = serializer.validated_data.get('image')
        lat = serializer.validated_data.get('latitude')
        lon = serializer.validated_data.get('longitude')

        ai_data = get_gemini_report(image)
        severity = ai_data.get('severity', 1)
        description = ai_data.get('description', '')

        density = 10
        if lat and lon:
            density = get_osm_poi_density(lat, lon)

        priority = calculate_priority(severity, density)

        serializer.save(
            user=self.request.user,
            ai_description=description,
            severity_score=severity,
            priority_level=priority
        )

    # Removed original create method as it's now handled in perform_create for better DRY logic
