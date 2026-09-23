#!/usr/bin/env bash
# Generate Google Play store PNGs from original Sky Hop canvas art (Coral Hopper).
# Requires: google-chrome (or chromium), ImageMagick (magick).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="file://${ROOT}/scripts/store-gen/export.html"
OUT="${ROOT}/store-assets"
SECRETS_OUT="${SKYHOP_SECRETS_STORE_ASSETS:-/home/box/sky-hop-secrets/store-assets}"
mkdir -p "$OUT"

CHROME="${CHROME_BIN:-}"
if [[ -z "$CHROME" ]]; then
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$c" >/dev/null 2>&1; then CHROME="$c"; break; fi
  done
fi
[[ -n "$CHROME" ]] || { echo "Chrome/Chromium required" >&2; exit 1; }
command -v magick >/dev/null || { echo "ImageMagick (magick) required" >&2; exit 1; }

render() {
  local asset="$1" w="$2" h="$3" outfile="$4" scale_w="$5" scale_h="$6"
  local tmp
  tmp="$(mktemp /tmp/skyhop-XXXXXX.png)"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
    --force-device-scale-factor=1 \
    --window-size="${w},${h}" \
    --screenshot="$tmp" \
    "${HTML}?asset=${asset}" >/dev/null 2>&1 || true
  if [[ ! -s "$tmp" ]]; then
    echo "Failed to capture $asset" >&2
    rm -f "$tmp"
    exit 1
  fi
  magick "$tmp" -gravity NorthWest -crop "${w}x${h}+0+0" +repage \
    -filter Lanczos -resize "${scale_w}x${scale_h}!" -strip "PNG32:${outfile}"
  rm -f "$tmp"
  identify "$outfile"
}

render icon 512 512 "$OUT/icon-512.png" 512 512
render feature 1024 500 "$OUT/feature-1024x500.png" 1024 500
render phone-ready 360 640 "$OUT/phone-screenshot-01-ready.png" 1080 1920
render phone-playing 360 640 "$OUT/phone-screenshot-02-playing.png" 1080 1920
render phone-over 360 640 "$OUT/phone-screenshot-03-gameover.png" 1080 1920

if [[ -d "$(dirname "$SECRETS_OUT")" ]]; then
  mkdir -p "$SECRETS_OUT"
  cp -f "$OUT"/*.png "$SECRETS_OUT/"
  echo "Mirrored to $SECRETS_OUT"
fi

echo "Done → $OUT"
