#!/usr/bin/env bash
# From a WSL checkout: installs the APK built by apk-windows.sh on the running emulator, forwards the local stack to it
# and runs the Playwright tests with the Node of Windows (the emulator's adb server is not reachable from WSL).
set -euo pipefail

mobile=$(cd "$(dirname "$0")/.." && pwd)
cd /mnt/c # cmd.exe cannot start in a WSL directory
local_app_data=$(cmd.exe /c 'echo %LOCALAPPDATA%' | tr -d '\r')
if [ -n "${WIN_ANDROID_HOME:-}" ]; then
  adb=$(wslpath "$WIN_ANDROID_HOME")/platform-tools/adb.exe
else
  adb=$(wslpath "$local_app_data")/Android/Sdk/platform-tools/adb.exe
fi
target=$(wslpath "$local_app_data")/yawar-apk/e2e

"$adb" install -r "$(wslpath -w "$mobile/dist/yawar-debug.apk")"
"$adb" reverse tcp:8000 tcp:8000 # API Gateway
"$adb" reverse tcp:8080 tcp:8080 # Keycloak

rm -rf "$target/e2e"
mkdir -p "$target"
cp -r "$mobile/e2e" "$mobile/playwright.config.ts" "$target/"
cd "$target"
[ -f package.json ] || echo '{ "private": true, "type": "module" }' >package.json
# Same version as the repository's lock file.
version=$(node -p "require('$mobile/../node_modules/@playwright/test/package.json').version")
cmd.exe /c "npm install --no-audit --no-fund --save-exact @playwright/test@$version && npx playwright test"
