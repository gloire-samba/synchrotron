# === FICHIER : backend/booking/views.py ===
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Expert, TimeSlot, Appointment
from .serializers import UserSerializer, ExpertSerializer, TimeSlotSerializer, AppointmentSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .ai_service import analyser_requete_naturelle
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

User = get_user_model()

# [Entête] ViewSet pour les Experts
class ExpertViewSet(viewsets.ModelViewSet):
    queryset = Expert.objects.select_related('user').all()
    serializer_class = ExpertSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
# L'utilisation de 'select_related' est une optimisation de base de données. Elle force Django à faire une jointure SQL (JOIN) entre la table Expert et User, ce qui divise drastiquement le temps de réponse de l'API.

# [Entête] ViewSet pour les Créneaux
class TimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer

    def get_queryset(self):
        # Filtre absolu : Uniquement les créneaux non réservés ET dont la date est supérieure à maintenant
        return TimeSlot.objects.filter(
            is_booked=False,
            start_time__gte=timezone.now()
        ).order_by('start_time')
# L'objectif ici est de filtrer les résultats directement à la source : l'API ne renverra jamais un créneau déjà réservé. Le frontend n'aura même pas besoin de faire le tri.

# [Entête] ViewSet pour les Réservations
# [Entête] ViewSet des Réservations avec envois d'emails transactionnels
# [Entête] ViewSet des Réservations avec envois d'emails transactionnels
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        return Appointment.objects.filter(
            patient=self.request.user,
            time_slot__start_time__gte=timezone.now()
        ).order_by('time_slot__start_time')

    def perform_create(self, serializer):
        appointment = serializer.save(patient=self.request.user)
        appointment.time_slot.is_booked = True
        appointment.time_slot.save()

        start_time_str = appointment.time_slot.start_time.strftime("%d/%m/%Y à %H:%M")
        expert = appointment.time_slot.expert.user
        expert_name = expert.first_name if expert.first_name else "votre expert"
        
        # 1. Email au Patient
        try:
            send_mail(
                subject="Confirmation de votre réservation - Synchrotron SOLEIL",
                message=f"Bonjour,\n\nVotre réservation du {start_time_str} avec {expert_name} est confirmée.\n\nL'équipe Synchrotron.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[appointment.patient.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"ERREUR SMTP (Patient Confirmation) : {e}")
            
        # 2. Email à l'Expert
        try:
            send_mail(
                subject="Nouvelle réservation sur votre planning - Synchrotron SOLEIL",
                message=f"Bonjour,\n\nLe patient {appointment.patient.email} a réservé un créneau avec vous le {start_time_str}.\n\nL'équipe Synchrotron.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[expert.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"ERREUR SMTP (Expert Confirmation) : {e}")

    def perform_destroy(self, instance):
        time_slot = instance.time_slot
        time_slot.is_booked = False
        time_slot.save()

        start_time_str = time_slot.start_time.strftime("%d/%m/%Y à %H:%M")
        expert = time_slot.expert.user
        
        # 1. Email d'annulation au Patient
        try:
            send_mail(
                subject="Annulation de votre réservation - Synchrotron SOLEIL",
                message=f"Bonjour,\n\nNous confirmons l'annulation de votre réservation du {start_time_str}.\n\nL'équipe Synchrotron.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.patient.email],
                fail_silently=True,
            )
        except Exception:
            pass

        # 2. Email d'annulation à l'Expert
        try:
            send_mail(
                subject="Un patient a annulé un rendez-vous - Synchrotron SOLEIL",
                message=f"Bonjour,\n\nLe patient {instance.patient.email} a annulé sa réservation du {start_time_str}. Votre créneau a été libéré.\n\nL'équipe Synchrotron.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[expert.email],
                fail_silently=True,
            )
        except Exception:
            pass

        instance.delete()
        
    
# En encapsulant send_mail dans une méthode privée _envoyer_email_rdv, on respecte le principe DRY (Don't Repeat Yourself). La méthode perform_destroy inclut également la logique de libération du TimeSlot, indispensable pour qu'il redevienne disponible pour les autres chercheurs.
# Le but de ces surcharges est de garantir l'isolation des données (Multi-tenant data isolation). Un utilisateur ne peut voir que SES propres rendez-vous (get_queryset) et, lors de la création (perform_create), on force l'ID du patient avec l'ID de l'utilisateur connecté, empêchant toute usurpation via l'API.

# [Entête] Point d'entrée pour le moteur de recherche NLP
class BookingAssistantView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request, *args, **kwargs):
        texte = request.data.get('query', '')
        
        if not texte:
            return Response({"error": "La requête est vide."}, status=status.HTTP_400_BAD_REQUEST)
            
        criteres = analyser_requete_naturelle(texte)
        
        # Ici on interroge la base de données avec les critères extraits par l'IA
        experts = Expert.objects.all()
        if criteres.get('specialty'):
            experts = experts.filter(specialty__icontains=criteres['specialty'])
            
        resultats = ExpertSerializer(experts, many=True).data
        
        return Response({
            "ia_analysis": criteres,
            "experts_trouves": resultats
        }, status=status.HTTP_200_OK)

# L'APIView est utilisée ici au lieu d'un ViewSet car il s'agit d'une action personnalisée qui ne correspond pas au format CRUD classique (Create/Read/Update/Delete) d'un modèle de base de données.

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        # La suppression de l'utilisateur supprimera automatiquement ses réservations en cascade
        # grâce au comportement par défaut de Django (on_delete=models.CASCADE)
        user.delete()
        return Response({"detail": "Compte supprimé avec succès."}, status=status.HTTP_204_NO_CONTENT)
    
# [Entête] ViewSet dédié au tableau de bord des Experts
# [Entête] ViewSet dédié au tableau de bord des Experts
class ExpertDashboardViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # NOUVEAU : On rejette brutalement si ce n'est pas un expert (Code 403)
        if not hasattr(self.request.user, 'expert_profile'):
            raise PermissionDenied("Accès refusé : espace réservé aux experts.")
            
        return TimeSlot.objects.filter(expert=self.request.user.expert_profile).order_by('-start_time')

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'expert_profile'):
            serializer.save(expert=self.request.user.expert_profile)
        else:
            raise PermissionDenied("Accès refusé.")

    def perform_destroy(self, instance):
        # Si le créneau était réservé et que l'expert le supprime, on prévient le patient !
        if instance.is_booked and hasattr(instance, 'appointment'):
            start_time_str = instance.start_time.strftime("%d/%m/%Y à %H:%M")
            try:
                send_mail(
                    subject="Créneau annulé par l'expert - Synchrotron SOLEIL",
                    message=f"Bonjour,\n\nL'expert a dû exceptionnellement annuler votre réservation du {start_time_str}. Veuillez nous excuser pour ce désagrément.\n\nL'équipe Synchrotron.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.appointment.patient.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Erreur SMTP (Annulation Expert) : {e}")
                
        # La suppression du TimeSlot entraînera automatiquement la suppression de l'Appointment grâce au on_delete=CASCADE
        instance.delete()