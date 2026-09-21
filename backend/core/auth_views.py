# === FICHIER : backend/core/auth_views.py ===
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.linkedin_oauth2.views import LinkedInOAuth2Adapter # Retour à la normale
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
import os

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = f"{FRONTEND_URL}/auth/google/callback"
    client_class = OAuth2Client

class GithubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    callback_url = f"{FRONTEND_URL}/auth/github/callback"
    client_class = OAuth2Client

class LinkedInLogin(SocialLoginView):
    adapter_class = LinkedInOAuth2Adapter # Retour à la normale
    callback_url = f"{FRONTEND_URL}/auth/linkedin/callback"
    client_class = OAuth2Client