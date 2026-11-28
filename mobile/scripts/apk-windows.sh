#!/usr/bin/env bash
# From a WSL checkout, builds the debug APK with the Android SDK and JDK installed on Windows. Gradle does not work on
# the WSL file system from Windows, so the Android project and the Capacitor sources are mirrored to a Windows folder.
# Override with WIN_JAVA_HOME / WIN_ANDROID_HOME (Windows paths) if they are not in the Android Studio defaults.
set -euo pipefail

mobile=$(cd "$(dirname "$0")/.." && pwd)
repo=$(dirname "$mobile")
cd /mnt/c # cmd.exe cannot start in a WSL directory
local_app_data=$(cmd.exe /c 'echo %LOCALAPPDATA%' | tr -d '\r')
java_home=${WIN_JAVA_HOME:-'C:\Program Files\Android\Android Studio\jbr'}
android_home=${WIN_ANDROID_HOME:-"$local_app_data\\Android\\Sdk"}
target=$(wslpath "$local_app_data")/yawar-apk

(cd "$repo" && npm run build --workspace @yawar/mobile)

# Sources are replaced on every run; Gradle's own folders stay, so later builds are fast.
rm -rf "$target/node_modules" "$target/mobile/android/app/src"
mkdir -p "$target/mobile" "$target/node_modules/@capacitor"
cp -r "$mobile/android" "$target/mobile/"
cp -r "$repo/node_modules/@capacitor/android" "$repo/node_modules/@capacitor/app" "$target/node_modules/@capacitor/"

cd "$target/mobile/android"
WSLENV="${WSLENV:+$WSLENV:}JAVA_HOME:ANDROID_HOME" JAVA_HOME="$java_home" ANDROID_HOME="$android_home" \
  cmd.exe /c '.\gradlew.bat --console=plain assembleDebug'

cp app/build/outputs/apk/debug/app-debug.apk "$mobile/dist/yawar-debug.apk"
echo "APK: mobile/dist/yawar-debug.apk ($(wslpath -w "$target/mobile/android/app/build/outputs/apk/debug/app-debug.apk"))"
