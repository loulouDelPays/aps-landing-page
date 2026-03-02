#!/bin/bash
# À exécuter sur le serveur depuis /var/www/aps-logiciel
# Corrige le 403 Forbidden sur les vidéos : Apache doit pouvoir traverser
# les répertoires (x) et lire les fichiers (r).

cd "$(dirname "$0")/.." || exit 1

echo "Correction des permissions pour assets/videos..."
chmod 755 assets
chmod 755 assets/videos
chmod 644 assets/videos/*.mp4 2>/dev/null || true

echo "Vérification :"
ls -la assets/videos/
