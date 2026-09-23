#!/usr/bin/env bash
# Linux/macOS counterpart — requires JDK 21 + Android SDK + keystore.properties
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ ! -f android/keystore.properties ]]; then
  echo "Missing android/keystore.properties — create keystore first (see PLAY_SHIP.md)." >&2
  exit 1
fi
if [[ -z "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]]; then
  echo "Set ANDROID_HOME to your Android SDK path." >&2
  exit 1
fi
SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
printf 'sdk.dir=%s\n' "$SDK" > android/local.properties
npm install
npm run cap:sync
(cd android && ./gradlew bundleRelease --stacktrace)
AAB="android/app/build/outputs/bundle/release/app-release.aab"
ls -la "$AAB"
echo "Upload: $AAB"
