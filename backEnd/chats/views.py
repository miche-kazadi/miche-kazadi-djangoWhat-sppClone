from django.utils import timezone
from .serializers import StorySerializer
from datetime import timedelta 
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes 
from .models import Conversation, Message, Profile
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token 
from rest_framework import generics, viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .serializers import ConversationSerializer, MessageSerializer
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Count
from .serializers import UserSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from .serializers import UserProfileSerializer
from django.shortcuts import get_object_or_404
from .models import Story
from collections import defaultdict




class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).distinct()

    
    @action(detail=True, methods=['get'])
    def message(self, request, pk=None):
        """
        """
        try:
            conversation = Conversation.objects.get(pk=pk)
            message = conversation.message.select_related('sender__profile').order_by('timestamp')
            
            serializer = MessageSerializer(message, many=True, context={'request': request})
            return Response(serializer.data)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversations introuvable"}, status=404)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        conversation_id = self.request.data.get('conversation')
        context['conversation_id'] = conversation_id
        return context

class MessageCreateView(generics.ListCreateAPIView):  # ListCreate autorise le GET (lecture) et le POST (envoi)
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        if conversation_id:
            return Message.objects.filter(
                conversation_id=conversation_id,
                conversation__participants=self.request.user
            ).order_by('timestamp')
        return Message.objects.none()

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        
        try:
            conversation = Conversation.objects.get(
                id=conversation_id, 
                participants=self.request.user
            )
            
            # SAUVEGARDE (ce que tu as déjà)
            message = serializer.save(sender=self.request.user, conversation=conversation)

            # AJOUT : ENVOI TEMPS RÉEL VIA WEBSOCKET
            channel_layer = get_channel_layer()
            
            # On prépare les données à envoyer (le format doit correspondre au MessageSerializer)
            message_data = {
                'id': message.id,
                'content': message.content,
                'sender_username': self.request.user.username,
                'timestamp': message.timestamp.isoformat(),
                'is_mine': False, # Pour le destinataire, ce ne sera pas son message
                'conversation': conversation_id
            }

            # On envoie au groupe spécifique de cette conversation
            async_to_sync(channel_layer.group_send)(
                f'chat_{conversation_id}',
                {
                    'type': 'chat_message', # Doit correspondre à la fonction dans consumers.py
                    'message': message_data
                }
            )

        except Conversation.DoesNotExist:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("Conversation introuvable ou accès refusé")



@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user:
        token, created  = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "username": user.username
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Identifiants invalides"}, status=status.HTTP_400_BAD_REQUEST) 


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    users = User.objects.exclude(id=request.user.id)
    # Utilise impérativement le Serializer pour inclure l'avatar !
    serializer = UserSerializer(users, many=True, context={'request': request})
    return Response(serializer.data)

@receiver(post_save, sender=User)
def handle_user_profile(sender, instance, created, **kwargs):
    if created:
        # get_or_create vérifie l'existence avant de tenter la création
        Profile.objects.get_or_create(user=instance)
    else:
        # Utilisation de getattr pour éviter les erreurs si le profil manque
        profile = getattr(instance, 'profile', None)
        if profile:
            profile.save()



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    user_id = request.data.get('user_id')
    other_user = User.objects.get(id=user_id)

    conversation = Conversation.objects.filter(participants=request.user).filter(participants=other_user).first()

    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)

    return Response({"id": conversation.id})



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    try:
        # On récupère ou crée le profil pour l'utilisateur connecté
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
            profile.save()
            
            # On renvoie les infos de l'utilisateur à jour
            serializer = UserSerializer(request.user, context={'request': request})
            return Response(serializer.data)
            
        return Response({"error": "Aucun fichier fourni"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contact_detail(request, pk):
    # On récupère l'utilisateur
    user = get_object_or_404(User, pk=pk)
    # Le serializer s'occupe de joindre les infos de Profile automatiquement
    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    # Le contexte est crucial pour générer l'URL de l'image http://127.0.0.1:8000/...
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def story_list_create(request):
    if request.method == 'POST':
        if 'image' not in request.FILES:
            return Response({"error": "Image manquante"}, status=400)
        story = Story.objects.create(user=request.user, image=request.FILES['image'])
        return Response(StorySerializer(story, context={'request': request}).data, status=201)

    # Récupérer les stories des dernières 24h
    time_threshold = timezone.now() - timedelta(hours=24)
    stories = Story.objects.filter(created_at__gte=time_threshold).order_by('-created_at')
    
    # --- LOGIQUE DE GROUPEMENT ---
    grouped_stories = defaultdict(list)
    for story in stories:
        data = StorySerializer(story, context={'request': request}).data
        grouped_stories[story.user.username].append(data)

    # On transforme le dictionnaire en une liste propre pour le frontend
    result = []
    for username, user_stories in grouped_stories.items():
        result.append({
            "username": username,
            "user_avatar": user_stories[0]['user_avatar'], # On prend l'avatar de la 1ère story
            "stories": user_stories # Contient la liste de toutes ses photos
        })
        
    return Response(result)