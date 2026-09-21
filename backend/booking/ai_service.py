# === FICHIER : backend/booking/ai_service.py ===
import os
import json
import google.generativeai as genai

# Initialisation du client avec la clé API injectée par Docker
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def analyser_requete_naturelle(texte_utilisateur):
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    Tu es un assistant d'orientation pour le Synchrotron SOLEIL.
    Analyse la requête de l'utilisateur et extrais les critères de réservation.
    Tu dois renvoyer UNIQUEMENT un objet JSON valide (sans markdown) avec ces clés :
    - "specialty" (string ou null si non précisé) : le domaine de recherche (ex: Spectroscopie, Cristallographie)
    - "date_pref" (string ou null) : la date mentionnée au format YYYY-MM-DD
    - "time_pref" (string ou null) : "matin" ou "apres-midi" ou une heure précise.
    
    Requête utilisateur : "{texte_utilisateur}"
    """
    
    response = model.generate_content(prompt)
    
    try:
        # Nettoyage de la réponse au cas où Gemini rajoute des balises ```json
        raw_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return {"specialty": None, "date_pref": None, "time_pref": None}

# L'utilisation du SDK officiel avec le modèle gemini-2.5-flash permet un traitement quasi instantané de la requête sémantique. Le bloc try/except garantit que notre API backend ne crashera pas si l'IA hallucine ou formate mal son JSON.