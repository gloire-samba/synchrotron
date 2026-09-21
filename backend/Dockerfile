# === FICHIER : backend/Dockerfile ===
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Explications des choix d'infrastructure :
# FROM : On utilise strictement Python 3.12 (ta contrainte) sur une distribution 'slim' (Debian allégée) pour limiter la taille de l'image.
# ENV : La première variable empêche Python de générer des fichiers .pyc inutiles en dev. La seconde force l'affichage direct des logs dans le terminal sans délai.
# RUN : On installe les dépendances sans garder le cache pip, ce qui allège l'image finale.