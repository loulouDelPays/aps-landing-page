#!/usr/bin/env bash
# Réencode les MP4 trop lourds ou trop grands pour le web.
# Un fichier déjà en H.264, sous la largeur cible et sous 25 Mio, est laissé tel quel.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAX_VIDEO_BYTES="$(( ${MAX_VIDEO_MB:-25} * 1024 * 1024 ))"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg absent — conservation des MP4 tels quels."
  exit 0
fi

already_web_ready() {
  local file="$1"
  local max_width="$2"
  local size probe codec width
  size="$(wc -c < "${file}" | tr -d '[:space:]')"
  if [[ "${size}" -gt "${MAX_VIDEO_BYTES}" ]]; then
    return 1
  fi
  if ! command -v ffprobe >/dev/null 2>&1; then
    return 1
  fi
  probe="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width -of csv=p=0 "${file}" 2>/dev/null || true)"
  codec="${probe%%,*}"
  width="${probe##*,}"
  [[ "${codec}" == "h264" && "${width}" =~ ^[0-9]+$ && "${width}" -le "${max_width}" ]]
}

optimize_file() {
  local file="$1"
  local scale="$2"
  local max_width="${scale%%:*}"
  local tmp="${file}.optimized.mp4"
  if [[ ! -f "${file}" ]]; then
    return 0
  fi
  if already_web_ready "${file}" "${max_width}"; then
    echo "Vidéo déjà adaptée au web, ignorée : ${file}"
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
