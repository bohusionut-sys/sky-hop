#!/usr/bin/env bash
set -euo pipefail
cd /workspace/sky-hop
npm install
npm run build:web
# Try adding android platform; tolerate missing SDK
if [ ! -d android ]; then
  npx cap add android || echo "CAP_ADD_ANDROID_FAILED=1" > /workspace/sky-hop/.cap-android-status
else
  echo "android/ already exists"
fi
if [ -d android ]; then
  npx cap sync || echo "CAP_SYNC_FAILED=1" >> /workspace/sky-hop/.cap-android-status
  echo "ANDROID_OK=1" > /workspace/sky-hop/.cap-android-status
fi
echo DONE
