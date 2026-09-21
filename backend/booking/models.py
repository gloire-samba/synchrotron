# === FICHIER : backend/booking/models.py ===

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

# [Entête] Gestionnaire personnalisé pour utiliser l'email comme identifiant principal
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)
# Ce manager redéfinit la logique de création d'utilisateur de Django. Il permet de se passer du champ 'username' par défaut et d'exiger un email unique, ce qui est le standard pour préparer une connexion OAuth et Email/Password propre.

# [Entête] Modèle Utilisateur personnalisé
class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()

    def __str__(self):
        return self.email
# En héritant d'AbstractUser et en supprimant le username, on garde toutes les fonctionnalités de sécurité de Django (hachage des mots de passe, gestion des permissions) tout en épurant le modèle.

# [Entête] Modèle pour les Experts (équivalent Médecin / Chercheur de ligne de lumière)
class Expert(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='expert_profile')
    specialty = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Expert: {self.user.email} - {self.specialty}"
# L'Expert est séparé du modèle User via une relation OneToOne. En conception logicielle, cela permet de garder la table User légère et strictement dédiée à l'authentification, tout en ayant une table dédiée pour les informations métier des chercheurs/médecins.

# [Entête] Modèle pour les Créneaux de disponibilité
class TimeSlot(models.Model):
    expert = models.ForeignKey(Expert, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.expert} | {self.start_time} - {self.end_time}"
# Ce modèle représente le calendrier de l'expert. Le champ booléen is_booked agit comme un cache : il permet de filtrer très rapidement les créneaux disponibles pour le Frontend React sans avoir à vérifier l'existence d'une réservation associée.

# [Entête] Modèle pour les Réservations (Rendez-vous / Session Synchrotron)
class Appointment(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    time_slot = models.OneToOneField(TimeSlot, on_delete=models.CASCADE, related_name='appointment')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RDV de {self.patient.email} pour {self.time_slot}"
# La relation OneToOneField avec TimeSlot est une sécurité architecturale forte. Elle garantit au niveau même de la base de données PostgreSQL qu'un créneau ne peut être réservé qu'une seule et unique fois, empêchant ainsi tout risque de double-réservation (double-booking).