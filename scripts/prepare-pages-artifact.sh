#!/usr/bin/env bash
# Build Eleventy site + optional video assets for GitHub Pages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/_site"

cd "${ROOT}"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
node scripts/write-videos-data.js
npm run build

mkdir -p "${OUT}/assets/videos"

copy_video() {
  local filename="$1"
  local url_var_name="$2"
  local dest="${OUT}/assets/videos/${filename}"
  if [[ -f "${ROOT}/assets/videos/${filename}" ]]; then
    cp "${ROOT}/assets/videos/${filename}" "${dest}"
    return 0
  fi
  local url="${!url_var_name:-}"
  if [[ -n "${url}" ]]; then
    echo "Téléchargement de ${filename} (${url_var_name})…"
    curl -fsSL "${url}" -o "${dest}"
    return 0
  fi
  echo "Avertissement : ${filename} absent (fichier local + ${url_var_name} non défini)."
  return 0
}

copy_video "APS-demo.mp4" "APS_DEMO_VIDEO_URL"
copy_video "testimonials.mp4" "APS_TESTIMONIAL_VIDEO_URL"

bash "${ROOT}/scripts/optimize-videos.sh"

node "${ROOT}/scripts/align-video-schema.js"

node "${ROOT}/scripts/check-build.js"

if [[ -f "${OUT}/assets/img/recherche_reliquat.jpg" ]]; then
  rm -f "${OUT}/assets/img/recherche_reliquat.jpg"
fi

touch "${OUT}/.nojekyll"
echo "Pages artifact ready: ${OUT}"
