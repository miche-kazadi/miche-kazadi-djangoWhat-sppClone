from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from.views import register_user
router = DefaultRouter()
# On utilise 'conversations' (AVEC UN S) pour correspondre au frontend
router.register(r'conversations', views.ConversationViewSet, basename='conversation')

urlpatterns = [
    # Routes d'authentification
    path('register/', views.register_user, name='register'), # Retiré 'api/'
    path('message/login/', views.login_view, name='login'),
    
    # Routes des utilisateurs et profils
    path('users/', views.users_list, name='users-list'),
    path('users/me/', views.get_my_profile, name='my-profile'),
    path('profile/upload/', views.upload_avatar, name='upload-avatar'),
    path('contacts/<int:pk>/', views.contact_detail, name='contact-detail'),

    # Routes de conversation et messages
    path('conversations/start/', views.start_conversation, name='start-conv'),
    path('conversations/<int:conversation_id>/messages/', views.MessageCreateView.as_view(), name='conversation-messages'),
    
    # Routes des stories
    path('stories/', views.story_list_create, name='stories'),
    
    # Inclusion du routeur
    path('', include(router.urls)),
]