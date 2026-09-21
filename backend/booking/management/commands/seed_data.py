# === FICHIER : backend/booking/management/commands/seed_data.py ===
import json
import os
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from booking.models import Expert, TimeSlot
import google.generativeai as genai

User = get_user_model()

class Command(BaseCommand):
    help = "Génère des données de test réalistes via Gemini 2.5 Flash"

    def handle(self, *args, **kwargs):
        current_count = Expert.objects.count()
        target_count = 100 if current_count == 0 else 10
        
        self.stdout.write(f"Analyse de la base... {current_count} experts existants. Génération de {target_count} nouvelles entités.")

        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            self.stdout.write(self.style.ERROR("Clé GEMINI_API_KEY introuvable."))
            return

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # On demande un format JSON strict pour éviter que le script plante
        prompt = f"""
        Génère un tableau JSON contenant exactement {target_count} profils de chercheurs ou lignes de lumière pour le Synchrotron SOLEIL.
        N'utilise QUE ce format strict, sans markdown ni texte avant ou après :
        [
            {{"nom": "Dr. Jean Dupont", "email": "jean.dupont@soleil.fr", "specialite": "Cristallographie des macromolécules"}},
            {{"nom": "Ligne PROXIMA-1", "email": "proxima1@soleil.fr", "specialite": "Diffraction des rayons X"}},
            ...
        ]
        """
        
        try:
            response = model.generate_content(prompt)
            # Nettoyage de la réponse au cas où l'IA ajouterait des balises markdown
            raw_text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
            profiles = json.loads(raw_text)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Échec de l'API Gemini ou du JSON : {e}."))
            return

        now = timezone.now()

        for prof in profiles:
            email = prof.get('email', f"chercheur_{random.randint(1,99999)}@soleil.fr")
            
            # Création de l'utilisateur
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={'password': 'password123', 'first_name': prof.get('nom', 'Expert')}
            )
            
            # Création de l'expert
            expert, _ = Expert.objects.get_or_create(
                user=user,
                defaults={'specialty': prof.get('specialite', 'Analyse structurelle')}
            )

            # Création de 3 créneaux : 1 dans le passé (pour tester le filtre), 2 dans le futur
            offsets = [
                random.randint(-15, -1),  # Passé
                random.randint(1, 10),    # Futur proche
                random.randint(11, 30)    # Futur lointain
            ]
            
            for offset in offsets:
                start = now + timedelta(days=offset, hours=random.randint(8, 16))
                end = start + timedelta(hours=2)
                TimeSlot.objects.create(expert=expert, start_time=start, end_time=end, is_booked=False)

        self.stdout.write(self.style.SUCCESS(f"Succès ! {target_count} experts et {target_count * 3} créneaux ajoutés."))