# === FICHIER : backend/booking/serializers.py ===
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Expert, TimeSlot, Appointment
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import PasswordResetSerializer

# NOUVEAUX IMPORTS POUR FORCER L'EMAIL
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import os

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    
    is_expert = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email','is_expert']
        # On empêche la modification de l'email et de l'ID via le formulaire de profil
        read_only_fields = ['id', 'email','is_expert']
        
    # Cette fonction vérifie si l'utilisateur possède un profil expert lié
    def get_is_expert(self, obj):
        return hasattr(obj, 'expert_profile')
class ExpertSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Expert
        fields = ['id', 'user', 'specialty']

class TimeSlotSerializer(serializers.ModelSerializer):
    expert = ExpertSerializer(read_only=True)
    # NOUVEAU : Champ calculé pour récupérer les infos du patient si réservé
    patient_info = serializers.SerializerMethodField()

    class Meta:
        model = TimeSlot
        fields = ['id', 'expert', 'start_time', 'end_time', 'is_booked', 'patient_info']

    def get_patient_info(self, obj):
        # Si le créneau est réservé, on va chercher les données du patient via l'Appointment
        if obj.is_booked and hasattr(obj, 'appointment'):
            patient = obj.appointment.patient
            return {
                "name": f"{patient.first_name} {patient.last_name}".strip() or "Utilisateur",
                "email": patient.email,
            }
        return None

class AppointmentSerializer(serializers.ModelSerializer):
    
    time_slot_details = TimeSlotSerializer(source='time_slot', read_only=True)
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'time_slot', 'time_slot_details', 'reason', 'created_at']
        read_only_fields = ['patient']
        
class CustomRegisterSerializer(RegisterSerializer):
    username = None

# NOUVEAU : Prise de contrôle absolue sur la réinitialisation
class CustomPasswordResetSerializer(PasswordResetSerializer):
    def save(self):
        # En remplaçant entièrement la fonction save(), on bloque l'email par défaut 'example.com' de Django
        email = self.validated_data.get('email')
        user = User.objects.filter(email=email).first()
        
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # C'est ici que l'on construit TON adresse React
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
            reset_link = f"{frontend_url}/changement-de-mot-de-passe/{uid}/{token}"
            
            try:
                send_mail(
                    subject="Réinitialisation de votre mot de passe - Synchrotron",
                    message=f"Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe.\nCliquez sur le lien suivant pour créer un nouveau mot de passe :\n\n{reset_link}\n\nSi vous n'avez rien demandé, ignorez cet email.\nL'équipe Synchrotron.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"ERREUR CRITIQUE SMTP (Mot de passe oublié) : {e}")