# === FICHIER : backend/booking/tests.py ===
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Expert, TimeSlot, Appointment
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.mark.django_db
class TestBookingAPI:
    def setup_method(self):
        """Initialisation des fausses données en base de test avant chaque test."""
        self.client = APIClient()
        self.patient1 = User.objects.create_user(email="patient1@test.fr", password="password123")
        self.patient2 = User.objects.create_user(email="patient2@test.fr", password="password123")
        self.expert_user = User.objects.create_user(email="expert@test.fr", password="password123")
        self.expert = Expert.objects.create(user=self.expert_user, specialty="Physique quantique")
        
        # Créneau disponible dans le futur
        self.slot_futur = TimeSlot.objects.create(
            expert=self.expert,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            is_booked=False
        )

        # Créneau dans le passé (censé être masqué par l'API)
        self.slot_passe = TimeSlot.objects.create(
            expert=self.expert,
            start_time=timezone.now() - timedelta(days=1),
            end_time=timezone.now() - timedelta(hours=22),
            is_booked=False
        )

    def test_timeslots_list_only_future_and_available(self):
        """L'API ne doit renvoyer que les créneaux futurs et non réservés."""
        response = self.client.get('/api/timeslots/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['id'] == self.slot_futur.id

    def test_create_appointment_locks_timeslot_and_assigns_patient(self):
        """Réserver un créneau le verrouille et l'assigne automatiquement à l'utilisateur connecté."""
        self.client.force_authenticate(user=self.patient1)
        
        response = self.client.post('/api/appointments/', {
            'time_slot': self.slot_futur.id,
            'reason': 'Analyse'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Le créneau doit être verrouillé
        self.slot_futur.refresh_from_db()
        assert self.slot_futur.is_booked is True
        
        # Le backend doit avoir forcé le patient1 comme propriétaire, empêchant toute usurpation
        appointment = Appointment.objects.get(id=response.data['id'])
        assert appointment.patient == self.patient1

    def test_appointments_data_isolation(self):
        """Un utilisateur ne doit pas pouvoir voir les réservations d'un autre utilisateur."""
        # Patient 1 fait une réservation
        Appointment.objects.create(patient=self.patient1, time_slot=self.slot_futur, reason="Secret")
        
        # Patient 2 se connecte et interroge la liste
        self.client.force_authenticate(user=self.patient2)
        response = self.client.get('/api/appointments/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 0 # La liste de Patient 2 doit être vide

    def test_cancel_appointment_frees_timeslot(self):
        """Annuler une réservation doit déverrouiller le créneau pour qu'il redevienne disponible."""
        self.client.force_authenticate(user=self.patient1)
        
        resa = Appointment.objects.create(patient=self.patient1, time_slot=self.slot_futur, reason="A annuler")
        self.slot_futur.is_booked = True
        self.slot_futur.save()

        response = self.client.delete(f'/api/appointments/{resa.id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Le créneau doit redevenir disponible (is_booked = False)
        self.slot_futur.refresh_from_db()
        assert self.slot_futur.is_booked is False
        
@pytest.mark.django_db
class TestUserProfile:
    # On retire "api_client" des paramètres (self, api_client) pour le définir manuellement
    def test_update_profile_blocks_email_change(self):
        api_client = APIClient()  # <-- Instanciation ici
        
        user = User.objects.create_user(email="chercheur@soleil.fr", password="password123")
        api_client.force_authenticate(user=user)
        
        url = '/api/auth/user/'
        data = {
            "first_name": "Marie",
            "last_name": "Curie",
            "email": "hacker@pirate.com"
        }
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        
        assert user.first_name == "Marie"
        assert user.last_name == "Curie"
        assert user.email == "chercheur@soleil.fr"

    def test_rgpd_delete_account(self):
        api_client = APIClient()  # <-- Instanciation ici
        
        user = User.objects.create_user(email="supprimer@soleil.fr", password="password123")
        api_client.force_authenticate(user=user)
        
        url = '/api/profile/delete/'
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert User.objects.filter(email="supprimer@soleil.fr").count() == 0