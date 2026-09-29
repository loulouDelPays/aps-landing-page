#!/usr/bin/env bash
# Build a clean GitHub Pages artifact (HTML + assets only).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/_site"

rm -rf "${OUT}"
mkdir -p "${OUT}/assets/videos"

cp "${ROOT}/index.html" "${OUT}/"
for page in mentions-legales.html politique-confidentialite.html; do
  if [[ -f "${ROOT}/${page}" ]]; then
    cp "${ROOT}/${page}" "${OUT}/"
  fi
done
touch "${OUT}/.nojekyll"

if [[ -d "${ROOT}/assets" ]]; then
  rsync -a \
    --exclude '.DS_Store' \
    --exclude 'videos/*.mp4' \
    "${ROOT}/assets/" "${OUT}/assets/"
fi

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

if [[ -f "${OUT}/assets/img/recherche_reliquat.jpg" ]]; then
  rm -f "${OUT}/assets/img/recherche_reliquat.jpg"
fi

echo "Pages artifact ready: ${OUT}"
