from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Conversation, Message, Profile, Story, Contact
from .serializers import (
    ConversationSerializer, MessageSerializer, 
    UserSerializer, UserProfileSerializer, StorySerializer
)

# --- 1. AUTHENTIFICATION (LOGIN & REGISTER) ---

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Permet aux utilisateurs de créer leur propre compte"""
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')

    if not username or not password:
        return Response({'error': 'Nom d\'utilisateur et mot de passe requis'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Ce nom d\'utilisateur est déjà pris'}, status=400)

    try:
        with transaction.atomic():
            # Création de l'utilisateur
            user = User.objects.create_user(username=username, password=password, email=email)
            # Création immédiate du token pour le connecter après l'inscription
            token, _ = Token.objects.get_or_create(user=user)
            
        return Response({
            "token": token.key,
            "username": user.username,
            "message": "Compte créé avec succès !"
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "username": user.username
        }, status=status.HTTP_200_OK)
    return Response({"error": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)

# --- 2. MESSAGERIE & CONVERSATIONS ---

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).distinct()

    @action(detail=True, methods=['get'])
    def message(self, request, pk=None):
        try:
            conversation = self.get_object()
            # Optimisation : select_related pour charger le profil de l'envoyeur en une seule fois
            messages = conversation.messages.select_related('sender__profile').order_by('timestamp')
            serializer = MessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception:
            return Response({"error": "Conversation introuvable"}, status=404)

class MessageCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user
        ).select_related('sender__profile').order_by('timestamp')

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=self.request.user)
        message = serializer.save(sender=self.request.user, conversation=conversation)
        
        # Envoi en temps réel via WebSocket
        channel_layer = get_channel_layer()
        message_data = {
            'id': message.id,
            'content': message.content,
            'sender_username': self.request.user.username,
            'timestamp': message.timestamp.isoformat(),
            'image': message.image.url if message.image else None,
            'is_mine': False,
            'conversation': conversation.id
        }

        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation_id}',
            {
                'type': 'chat_message',
                'message': message_data
            }
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    user_id = request.data.get('user_id')
    other_user = get_object_or_404(User, id=user_id)
    conversation = Conversation.objects.filter(participants=request.user).filter(participants=other_user).first()
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)
    return Response({"id": conversation.id})

# --- 3. PROFILS & UTILISATEURS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    # Optimisation : On charge les profils pour éviter les requêtes N+1
    users = User.objects.exclude(id=request.user.id).select_related('profile')
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    profile = request.user.profile # Le signal handle_user_profile garantit l'existence du profil
    if 'avatar' in request.FILES:
        profile.avatar = request.FILES['avatar']
        profile.save()
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    return Response({"error": "Aucun fichier fourni"}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contact_detail(request, pk):
    user = get_object_or_404(User, pk=pk)
    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(serializer.data)

# --- 4. STORIES ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def story_list_create(request):
    if request.method == 'POST':
        if 'image' not in request.FILES:
            return Response({"error": "Image manquante"}, status=400)
        story = Story.objects.create(user=request.user, image=request.FILES['image'])
        return Response(StorySerializer(story, context={'request': request}).data, status=201)

    time_threshold = timezone.now() - timedelta(hours=24)
    stories = Story.objects.filter(created_at__gte=time_threshold).select_related('user__profile').order_by('-created_at')
    
    grouped_stories = defaultdict(list)
    for story in stories:
        data = StorySerializer(story, context={'request': request}).data
        grouped_stories[story.user.username].append(data)

    result = [
        {
            "username": username,
            "user_avatar": user_stories[0]['user_avatar'],
            "stories": user_stories
        } for username, user_stories in grouped_stories.items()
    ]
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_contacts(request):
    contacts = Contact.objects.filter(user=request.user).select_related('contact__profile')

    data = [
        {
            "id": c.contact.id,
            "username": c.contact.username,
            "avatar": c.contact.profile.avatar.url if c.contact.profile.avatar else None,
            "is_online": c.contact.profile.is_online
        }
        for c in contacts
    ]

    return Response(data)


# --- 5. SIGNALS (GESTION AUTO DU PROFIL) ---

@receiver(post_save, sender=User)
def handle_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_contact(request):
    username = request.data.get("username")

    if not username:
        return Response({"error": "Username requis"}, status=400)

    try:
        contact_user = User.objects.get(username=username)

        if contact_user == request.user:
            return Response({"error": "Impossible de t'ajouter toi-même"}, status=400)

        contact, created = Contact.objects.get_or_create(
            user=request.user,
            contact=contact_user
        )

        if not created:
            return Response({"message": "Contact déjà ajouté"})

        # Création automatique de conversation
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=contact_user
        ).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, contact_user)

        return Response({
            "message": "Contact ajouté avec succès",
            "conversation_id": conversation.id
        })

    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable"}, status=404)