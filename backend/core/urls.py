"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include,re_path
from .auth_views import GoogleLogin, GithubLogin, LinkedInLogin
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('booking.urls')),
    
    # Routes d'authentification (Login, Logout, User info)
    path('api/auth/', include('dj_rest_auth.urls')),
    # Routes d'inscription (Register)
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Authentification OAuth
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('api/auth/github/', GithubLogin.as_view(), name='github_login'),
    path('api/auth/linkedin/', LinkedInLogin.as_view(), name='linkedin_login'),
    
    # Route factice obligatoire pour que django-allauth puisse générer l'email de réinitialisation
    path('api/auth/password/reset/confirm/<str:uidb64>/<str:token>/', 
         TemplateView.as_view(), 
         name='password_reset_confirm'),
]
# On préfixe toutes nos routes par 'api/'. Ainsi, pour récupérer les experts, le frontend React appellera l'adresse http://localhost:8000/api/experts/.
# Ces deux includes génèrent automatiquement les endpoints POST /api/auth/login/ et POST /api/auth/registration/ qui acceptent { "email": "...", "password": "..." }.
