#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMG="$ROOT/assets/img"

convert_image() {
  local src="$1"
  local base="$2"
  shift 2
  local widths=("$@")

  for w in "${widths[@]}"; do
    sips -Z "$w" "$src" --out "/tmp/${base}-${w}.png" >/dev/null
    avifenc --min 20 --max 35 --speed 6 "/tmp/${base}-${w}.png" "$IMG/${base}-${w}.avif" >/dev/null 2>&1
    cwebp -q 82 "/tmp/${base}-${w}.png" -o "$IMG/${base}-${w}.webp" >/dev/null
    rm -f "/tmp/${base}-${w}.png"
    echo "  ${base}-${w}: avif=$(du -k "$IMG/${base}-${w}.avif" | cut -f1)K webp=$(du -k "$IMG/${base}-${w}.webp" | cut -f1)K"
  done
}

echo "== Workshop photos =="
convert_image "$IMG/atelier-hero.png" "atelier-hero" 960 1440 1920
convert_image "$IMG/atelier-equipe.png" "atelier-equipe" 640 960 1280
convert_image "$IMG/piece-etiquetee.png" "piece-etiquetee" 560 840 1122

echo "== Product screenshots =="
convert_image "$IMG/screenshot_search.png" "screenshot_search" 640 960 1280
convert_image "$IMG/exemple_resultat_recherche.png" "exemple_resultat_recherche" 640 900 1280
convert_image "$IMG/testimonials_couverture.png" "testimonials_couverture" 640 960 1280
convert_image "$IMG/markeplace.png" "markeplace" 640 960 1280
convert_image "$IMG/recherche_reliquat.png" "recherche_reliquat" 640 960 1280

echo "== Cleanup source PNGs =="
rm -f \
  "$IMG/atelier-hero.png" \
  "$IMG/atelier-equipe.png" \
  "$IMG/piece-etiquetee.png" \
  "$IMG/screenshot_search.png" \
  "$IMG/exemple_resultat_recherche.png" \
  "$IMG/testimonials_couverture.png" \
  "$IMG/markeplace.png" \
  "$IMG/recherche_reliquat.png"

echo "== Done =="
du -sh "$IMG"
