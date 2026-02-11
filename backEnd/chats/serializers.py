from urllib import request
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message, Profile





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
        # Sécurité : renvoie False si le profil n'existe pas
        return getattr(obj.profile, 'is_online', False) if hasattr(obj, 'profile') else False

    def get_last_seen(self, obj):
        return getattr(obj.profile, 'last_seen', None) if hasattr(obj, 'profile') else None
    

class MessageSerializer(serializers.ModelSerializer):
    is_mine = serializers.SerializerMethodField()
    sender_username = serializers.ReadOnlyField(source='sender.username')
    
    # AJOUTE CETTE LIGNE : pour que le serializer accepte l'ID du destinataire
    receiver_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'content', 'timestamp', 'is_mine', 'receiver_id']
        read_only_fields = ['sender']
        # AJOUTE CECI : pour que 'conversation' ne bloque plus la requête POST
        extra_kwargs = {
            'conversation': {'required': False, 'allow_null': True}
        }

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
            # On récupère l'autre participant
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                

                return UserSerializer(
                    other_user,
                    context={'request': self.context.get('request')}
                ).data

        return None

    def get_last_message(self, obj):
        last_msg = obj.messages.all().order_by('-timestamp').first()
        if  last_msg:
            # On passe le contexte pour que is_mine fonctionne aussi dans la liste
            return MessageSerializer(last_msg, context=self.context).data
        
        return None 
    
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'is_online', 'last_seen']




    
class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField() # Change ici
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