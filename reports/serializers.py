from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Report

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'is_staff', 'first_name', 'last_name')

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = (
            'id', 'user', 'image', 'latitude', 'longitude', 'ai_description', 
            'severity_score', 'density_index', 'priority_level', 'status', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('user', 'ai_description', 'severity_score', 'density_index', 'priority_level', 'status')
