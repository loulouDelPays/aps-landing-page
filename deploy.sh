#!/usr/bin/env bash
# Déploiement serveur : git pull, build Eleventy, optimisations, publication de _site/.
#
# Prérequis : Node.js 20+, npm, git, curl ; ffmpeg recommandé (vidéos).
#
# Variables d'environnement :
#   APS_WEB_ROOT          docroot distinct du clone git.
#                         Vide ou dossier absent : le site reste dans _site/
#                         (à déclarer comme DocumentRoot). Ne jamais viser le clone :
#                         rsync --delete effacerait .git et src/.
#   APS_GIT_BRANCH        branche à déployer (défaut : main)
#   APS_DEMO_VIDEO_URL    URL optionnelle du MP4 démo si absent du disque
#   APS_TESTIMONIAL_VIDEO_URL  idem témoignages
#   APS_SKIP_GIT          1 = ne pas mettre à jour le dépôt (build local uniquement)
#   APS_SKIP_RSYNC        1 = build sans copie vers APS_WEB_ROOT (test)
#   APS_RSYNC_CHOWN       ex. www-data:www-data — chown après rsync (nécessite sudo)
#
# Fichier optionnel à la racine du clone : .deploy.env (APS_WEB_ROOT=…)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "${ROOT}"

if [[ -f "${ROOT}/.deploy.env" ]]; then
  # shellcheck disable=SC1091
  source "${ROOT}/.deploy.env"
fi

BRANCH="${APS_GIT_BRANCH:-main}"
WEB_ROOT="${APS_WEB_ROOT:-}"
SITE_DIR="${ROOT}/_site"

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] ERREUR: %s\n' "$*" >&2; exit 1; }

[[ -d "${ROOT}/.git" ]] || die "Ce répertoire n'est pas un clone git (${ROOT})."

if [[ "${APS_SKIP_GIT:-0}" != "1" ]]; then
  log "Mise à jour git (origin/${BRANCH})…"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}" 2>/dev/null || git checkout -b "${BRANCH}" "origin/${BRANCH}"
  git reset --hard "origin/${BRANCH}"
  log "Commit déployé : $(git rev-parse --short HEAD) — $(git log -1 --format=%s)"
else
  log "APS_SKIP_GIT=1 — pas de git pull."
fi

if [[ -z "${WEB_ROOT}" || ! -d "${WEB_ROOT}" ]]; then
  if [[ -n "${WEB_ROOT}" ]]; then
    log "APS_WEB_ROOT inexistant (${WEB_ROOT}) — pas de copie."
  fi
  WEB_ROOT=""
fi

# Un rsync --delete dans le clone supprimerait git, src et node_modules.
if [[ -n "${WEB_ROOT}" ]]; then
  WEB_ROOT="$(cd "${WEB_ROOT}" && pwd)"
  if [[ "${WEB_ROOT}" == "${ROOT}" || "${WEB_ROOT}" == "${ROOT}/"* ]]; then
    die "APS_WEB_ROOT (${WEB_ROOT}) est dans le clone. Pointez le vhost sur ${SITE_DIR}, ou choisissez un dossier hors du dépôt."
  fi
fi

log "Build et optimisations (prepare-pages-artifact)…"
bash "${ROOT}/scripts/prepare-pages-artifact.sh"

[[ -d "${SITE_DIR}" ]] || die "Build sans _site/ — abandon."
[[ -f "${SITE_DIR}/index.html" ]] || die "_site/index.html manquant — abandon."

if [[ "${APS_SKIP_RSYNC:-0}" == "1" || -z "${WEB_ROOT}" ]]; then
  log "Artefact prêt : ${SITE_DIR}"
  log "DocumentRoot Apache/Nginx : ${SITE_DIR}"
  exit 0
fi

if ! command -v rsync >/dev/null 2>&1; then
  die "rsync est requis pour publier vers ${WEB_ROOT}"
fi

log "Publication vers ${WEB_ROOT} (rsync --delete)…"
rsync -a --delete --human-readable --stats \
  "${SITE_DIR}/" "${WEB_ROOT}/"

if [[ -n "${APS_RSYNC_CHOWN:-}" ]]; then
  log "chown ${APS_RSYNC_CHOWN} sur ${WEB_ROOT}…"
  sudo chown -R "${APS_RSYNC_CHOWN}" "${WEB_ROOT}"
fi

log "Déploiement terminé."
