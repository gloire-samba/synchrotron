# === FICHIER : backend/booking/tasks.py ===
from celery import shared_task
from django.utils import timezone
from datetime import timedelta, time
from django.core.mail import send_mail
from django.conf import settings
from .models import Appointment

@shared_task
def envoyer_rappels_rdv():
    """
    Tâche exécutée quotidiennement pour envoyer un rappel (J-1) aux patients.
    """
    # 1. Obtenir la date exacte de demain
    date_demain = timezone.now().date() + timedelta(days=1)
    
    # 2. Créer une fenêtre de minuit à 23h59 pour la journée de demain
    demain_debut = timezone.make_aware(timezone.datetime.combine(date_demain, time.min))
    demain_fin = timezone.make_aware(timezone.datetime.combine(date_demain, time.max))
    
    rendez_vous_demain = Appointment.objects.filter(
        time_slot__start_time__gte=demain_debut,
        time_slot__start_time__lte=demain_fin
    )
    
    compteur = 0
    for rdv in rendez_vous_demain:
        start_time_str = rdv.time_slot.start_time.strftime("%d/%m/%Y à %H:%M")
        expert_name = rdv.time_slot.expert.user.last_name or "Expert"
        patient_email = rdv.patient.email
        
        try:
            send_mail(
                subject="RAPPEL : Votre réservation de demain - Synchrotron SOLEIL",
                message=f"Bonjour,\n\nCeci est un rappel automatique. N'oubliez pas votre réservation prévue demain, le {start_time_str} avec {expert_name}.\n\nL'équipe Synchrotron.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[patient_email],
                fail_silently=True,
            )
            compteur += 1
        except Exception as e:
            print(f"Erreur d'envoi de rappel pour {patient_email}: {e}")
            
    return f"Tâche terminée : {compteur} e-mails de rappel envoyés."