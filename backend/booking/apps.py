# === FICHIER : backend/booking/apps.py ===
from django.apps import AppConfig

class BookingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'booking'

    # Surcharge de la méthode ready pour charger les signaux
    def ready(self):
        import booking.signals