#!/usr/bin/env bash
# Réencode les MP4 pour le web (CI ou local, si ffmpeg est disponible).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg absent — conservation des MP4 tels quels."
  exit 0
fi

optimize_file() {
  local file="$1"
  local scale="$2"
  local tmp="${file}.optimized.mp4"
  if [[ ! -f "${file}" ]]; then
    return 0
  fi
  echo "Optimisation vidéo : ${file}…"
  ffmpeg -y -i "${file}" \
    -vf "scale=${scale}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 -preset slow -crf 30 -maxrate 2500k -bufsize 5000k -movflags +faststart \
    -c:a aac -b:a 96k \
    "${tmp}"
  mv "${tmp}" "${file}"
}

optimize_dir() {
  local dir="$1"
  [[ -d "${dir}" ]] || return 0
  optimize_file "${dir}/APS-demo.mp4" "1280:-2"
  optimize_file "${dir}/testimonials.mp4" "720:-2"
}

optimize_dir "${ROOT}/assets/videos"
optimize_dir "${ROOT}/_site/assets/videos"
