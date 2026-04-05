from django.db import models

class Report(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
    ]

    image = models.ImageField(upload_to='reports/images/', blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    
    ai_description = models.TextField(blank=True, null=True)
    severity_score = models.IntegerField(blank=True, null=True)
    density_index = models.IntegerField(blank=True, null=True)
    priority_level = models.CharField(max_length=20, choices=PRIORITY_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    
    # New Resolution Fields
    resolved_image = models.ImageField(upload_to='resolutions/images/', blank=True, null=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report #{self.id} - {self.status}"

class Notification(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='notifications')
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email} - {self.message[:20]}..."
