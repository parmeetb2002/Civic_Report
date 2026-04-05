from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'priority_level', 'severity_score', 'created_at')
    list_filter = ('status', 'priority_level')
    readonly_fields = ('ai_description', 'severity_score', 'priority_level')
