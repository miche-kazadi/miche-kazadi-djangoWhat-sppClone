from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message, Profile

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

    def get_avatar(self, obj):
        try:
            # Vérifie si le profil existe et s'il y a une image
            if hasattr(obj, 'profile') and obj.profile.avatar:
                request = self.context.get('request')
                # Si on a la requête, on génère l'URL absolue (http://127.0.0.1:8000/media/...)
                if request:
                    return request.build_absolute_uri(obj.profile.avatar.url)
                # Sinon on donne le chemin relatif
                return obj.profile.avatar.url
        except Exception:
            return None
        return None
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
        fields = ('id', 'created_at', 'other_user', 'last_message')

    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # On récupère l'autre participant
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                return UserSerializer(other_user, context=self.context).data
        return None

    def get_last_message(self, obj):
        last_msg = obj.messages.all().order_by('-timestamp').first()
        if last_msg:
            # On passe le contexte pour que is_mine fonctionne aussi dans la liste
            return MessageSerializer(last_msg, context=self.context).data
        return None 
    
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'is_online', 'last_seen']

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    # AJOUTE CECI : On récupère le statut directement depuis le profil
    is_online = serializers.BooleanField(source='profile.is_online', read_only=True)
    last_seen = serializers.DateTimeField(source='profile.last_seen', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online', 'last_seen'] # Ajoute les champs ici

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