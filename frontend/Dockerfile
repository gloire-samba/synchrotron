# === FICHIER : frontend/Dockerfile ===
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . ./

# Explications de la stratégie de build :
# On copie d'abord uniquement les fichiers package*.json avant d'exécuter npm install. 
# Cela permet d'exploiter le cache de Docker : si tu modifies ton code source mais pas tes dépendances, Docker ne refera pas l'installation NPM, gagnant ainsi un temps précieux lors des redémarrages.