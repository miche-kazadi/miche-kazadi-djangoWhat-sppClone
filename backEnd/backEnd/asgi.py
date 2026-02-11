"""
ASGI config for backEnd project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

"""
WSGI config for backEnd project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""
import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# 1. Configurer l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backEnd.settings')
django.setup()

# 2. Importer le routage (doit être fait APRES django.setup())
# Si 'import chats.routing' souligne en rouge, utilise 'from chats import routing'
try:
    from chats import routing
except ImportError:
    import chats.routing as routing

application = ProtocolTypeRouter({
    # Gère les requêtes API/HTTP normales
    "http": get_asgi_application(),
    
    # Gère les WebSockets pour le temps réel
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})