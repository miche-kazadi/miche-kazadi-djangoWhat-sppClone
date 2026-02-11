from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# On utilise 'conversations' (AVEC UN S) pour correspondre au frontend
router.register(r'conversations', views.ConversationViewSet, basename='conversation')

urlpatterns = [
    # 1. Routes spécifiques (toujours au pluriel pour la cohérence)
    path('conversations/start/', views.start_conversation, name='start-conv'),
    path('users/', views.users_list, name='users-list'),
    path('message/login/', views.login_view, name='login'),
    path('profile/upload/', views.upload_avatar, name='upload-avatar'),
    path('conversations/<int:conversation_id>/messages/', 
         views.MessageCreateView.as_view(), 
         name='conversation-messages'),

    path('', include(router.urls)),
]