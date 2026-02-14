
# Create your models here.

from django.dispatch import receiver
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta



# --- 1. MODÈLE PROFIL ---
class Profile(models.Model): 
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
        )
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True) 

    def __str__(self):
        return f"Profile of {self.user.username}"




# --- 2. MODÈLES DE CHAT ---
class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversations {self.id} between {', '.join([u.username for u in self.participants.all()])}"


# --- 2. MODÈLES DE Message ---

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:20]}"



class Story(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    image = models.ImageField(upload_to='stories/')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(hours=24)

    def __str__(self):
        return f"Story de {self.user.username} - {self.created_at}"



@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save() 