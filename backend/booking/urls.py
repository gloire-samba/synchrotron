# === FICHIER : backend/booking/urls.py ===
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpertViewSet, TimeSlotViewSet, AppointmentViewSet, BookingAssistantView, DeleteAccountView

# [Entête] Configuration du routeur DRF
router = DefaultRouter()
router.register(r'experts', ExpertViewSet, basename='expert')
router.register(r'timeslots', TimeSlotViewSet, basename='timeslot')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
    path('ia/assistant/', BookingAssistantView.as_view(), name='ia-assistant'),
    
    # NOUVEAU : Route de suppression
    path('profile/delete/', DeleteAccountView.as_view(), name='delete_account'),
]
# L'objectif du DefaultRouter est de générer automatiquement toutes les routes CRUD standards (GET, POST, PUT, DELETE) pour nos ViewSets, ce qui évite d'écrire des dizaines de lignes de configuration de chemins manuellement.