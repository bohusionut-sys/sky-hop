#!/usr/bin/env bash
# Portable Capacitor setup — run from repo root (Linux/macOS/Git Bash).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm install
npm run build:web
if [ ! -d android ]; then
  npx cap add android
else
  echo "android/ already exists"
fi
npx cap sync
echo "DONE — open with: npm run cap:open"
