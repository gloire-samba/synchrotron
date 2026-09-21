# === FICHIER : backend/core/settings.py ===
import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Chargement explicite du fichier .env situé à la racine du projet
load_dotenv(BASE_DIR.parent / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = True
# Convertir la chaîne "localhost,127.0.0.1" du .env en liste Python
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Nos dépendances
    'rest_framework',
    # Sécurité CORS & Auth
    'corsheaders',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'dj_rest_auth.registration',
    
    # Fournisseurs OAuth demandés
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
    'allauth.socialaccount.providers.linkedin_oauth2',
    
    # Nos applications
    'booking'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Doit être avant CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Middleware requis par django-allauth
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Configuration PostgreSQL pointant vers le conteneur Docker
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST', 'db'), 
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}
# Objectif de ces modifications : 
# 1. On intègre Django Rest Framework (DRF) qui nous servira à créer l'API pour React.
# 2. On configure PostgreSQL en lisant les variables d'environnement injectées par Docker Compose. Le 'HOST' pointe vers 'db', qui est le nom du service défini dans notre docker-compose.yml.

# On indique à Django d'utiliser notre futur modèle User personnalisé au lieu de celui par défaut
AUTH_USER_MODEL = 'booking.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# === FICHIER : backend/core/settings.py (À ajouter tout en bas) ===

# Configuration SMTP pour Gmail (Syntaxe stricte Django 6.1)
# Configuration SMTP standard et robuste
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com' # À adapter si tu n'utilises pas Gmail
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('EMAIL_HOST_USER')

# Ajouter cette nouvelle configuration en bas du fichier pour n'autoriser que React
CORS_ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
]

# Configuration globale de l'API
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication',
    ),
}

# Configuration dj-rest-auth pour utiliser JWT au lieu des tokens basiques
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'synchrotron-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'synchrotron-refresh',
    # On force l'utilisation de notre sérialiseur amputé du champ username
    'REGISTER_SERIALIZER': 'booking.serializers.CustomRegisterSerializer',
    # NOUVEAU : On branche notre sérialiseur de réinitialisation personnalisé
    'PASSWORD_RESET_SERIALIZER': 'booking.serializers.CustomPasswordResetSerializer',
    # NOUVEAU : On branche notre sérialiseur pour la gestion du profil
    'USER_DETAILS_SERIALIZER': 'booking.serializers.UserSerializer',
}

# Configuration Allauth pour forcer l'email au lieu de l'username
# === FICHIER : backend/core/settings.py (Section Allauth) ===

ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True

ACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_EMAIL_REQUIRED = False
SOCIALACCOUNT_AUTO_SIGNUP = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SOCIALACCOUNT_PROVIDERS = {
    'linkedin_oauth2': {
        'SCOPE': ['openid', 'profile', 'email'],
        'PROFILE_FIELDS': ['id', 'first_name', 'last_name', 'email', 'picture_url'],
    }
}

# Explications : 
# JWTCookieAuthentication est une excellente pratique de sécurité : au lieu de laisser le front-end React manipuler le token et le stocker de manière non sécurisée (LocalStorage), le backend l'enverra directement dans un cookie HttpOnly, le protégeant ainsi des attaques XSS.
# ACCOUNT_EMAIL_VERIFICATION = 'none' permet de tester la création de compte sans bloquer l'utilisateur en attendant un email de confirmation (on activera les emails plus tard).

CORS_ALLOW_CREDENTIALS = True

SITE_ID = 1