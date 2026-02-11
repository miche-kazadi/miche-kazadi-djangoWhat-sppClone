import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token
from .models import Profile

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        query_string = self.scope.get('query_string', b'').decode()
        token_key = None
        if 'token=' in query_string:
            token_key = query_string.split('token=')[1]

        self.user = await self.get_user_from_token(token_key)

        if not self.user:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        if self.user.is_authenticated:
            await self.update_user_status(True)


        if self.user and self.user.is_authenticated:
            await self.update_user_status(True)
        # On prévient tout le monde dans le groupe que je suis en ligne
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_status_update',
                'user_id': self.user.id,
                'is_online': True
            }
        )

    async def disconnect(self, close_code):
        if self.user and self.user.is_authenticated:
            await self.update_user_status(False)

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # ✅ CETTE MÉTHODE DOIT ÊTRE ICI
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))



    async def user_status_update(self, event):
      await self.send(text_data=json.dumps({
        'type': 'user_status',
        'user_id': event['user_id'],
        'is_online': event['is_online']
    }))



    @database_sync_to_async
    def get_user_from_token(self, token_key):
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def update_user_status(self, status):
        return Profile.objects.filter(user=self.user).update(is_online=status)
