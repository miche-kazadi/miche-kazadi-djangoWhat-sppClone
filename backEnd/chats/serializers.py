from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message, Profile, Story

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online', 'last_seen']

    def get_avatar(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.profile.avatar.url)
                return obj.profile.avatar.url
        except Exception:
            pass
        return None

    def get_is_online(self, obj):
        return getattr(obj.profile, 'is_online', False) if hasattr(obj, 'profile') else False

    def get_last_seen(self, obj):
        return getattr(obj.profile, 'last_seen', None) if hasattr(obj, 'profile') else None

class MessageSerializer(serializers.ModelSerializer):
    is_mine = serializers.SerializerMethodField()
    sender_username = serializers.ReadOnlyField(source='sender.username')
    receiver_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'content', 'timestamp', 'is_mine', 'receiver_id']
        read_only_fields = ['sender']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return obj.sender == request.user if request else False

class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'created_at', 'other_user', 'last_message', 'participants')

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                return UserSerializer(other_user, context={'request': request}).data
        return None

    # --- LA MÉTHODE DOIT ÊTRE ICI ---
    def get_last_message(self, obj):
        last_msg = obj.messages.all().order_by('-timestamp').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None 

class StorySerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = ['id', 'user', 'username', 'user_avatar', 'image', 'created_at']

    def get_user_avatar(self, obj):
        try:
            if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
                return obj.user.profile.avatar.url
        except:
            pass
        return None

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'is_online', 'last_seen']

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    is_online = serializers.BooleanField(source='profile.is_online', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'is_online']

    def get_avatar(self, obj):
        try:
            if hasattr(obj, 'profile') and obj.profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.profile.avatar.url)
                return obj.profile.avatar.url
        except Exception:
            return None
        return None