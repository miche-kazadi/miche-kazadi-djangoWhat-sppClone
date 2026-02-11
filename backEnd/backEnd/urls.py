from django.contrib import admin
from django.urls import path, include
from django.conf import settings 
from django.conf.urls.static import static 

urlpatterns = [
    path('admin/', admin.site.urls),
    # C'est ici que tes routes d'API (chats.urls) sont incluses
    path('api/', include('chats.urls')), 
]

# Cette partie permet d'afficher les photos d'avatar dans ton navigateur
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)