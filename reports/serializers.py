from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = (
            'id', 'image', 'latitude', 'longitude', 'ai_description', 
            'severity_score', 'priority_level', 'status', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('ai_description', 'severity_score', 'priority_level', 'status')
