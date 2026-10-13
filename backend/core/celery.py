# === FICHIER : backend/core/celery.py ===
import os
from celery import Celery
from celery.schedules import crontab

# Indiquer à Celery où se trouvent les settings de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')

# Demande à Celery de chercher automatiquement des fichiers tasks.py dans les applications
app.autodiscover_tasks()

# Configuration du Scheduler (Celery Beat)
app.conf.beat_schedule = {
    'rappel-rendez-vous-quotidien': {
        'task': 'booking.tasks.envoyer_rappels_rdv',
        # Exécuter cette tâche tous les jours à 08h00 du matin
        'schedule': crontab(hour=8, minute=0),
    },
}