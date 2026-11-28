# Yawar mobile (Android)

A minimal Capacitor wrapper over the web build (YAW-221): same screens, same API Gateway, same Keycloak.

## How it works
- The app's WebView serves the web build on `http://localhost`.
- Sign-in is Authorization Code + PKCE with its own public Keycloak client, `yawar-mobile`
  (Yawar-Backend, `deploy/keycloak`). Tokens stay in memory.
- `AppRedirectWebViewClient` reloads the redirect from Keycloak back to the app, which Android would
  otherwise send to the network.
- No silent single sign-on (`VITE_SILENT_SSO=off`): after the app restarts, "Iniciar sesión" brings the
  session back without the password while the Keycloak session lasts.
- Plain HTTP is allowed for `localhost` only. The API Gateway must allow the origin `http://localhost` in
  its CORS configuration (the local defaults do).

## Requirements
- Android Studio with an Android SDK, and an emulator or device (Android 7 or newer).
- JDK 21 to 25 (the one bundled with Android Studio works). The first build downloads Gradle and any
  missing SDK packages.

## Build the debug APK
From the repository root, after `npm ci`.

From WSL, using the SDK and JDK installed on Windows (`WIN_ANDROID_HOME` / `WIN_JAVA_HOME` override the
Android Studio defaults):
```bash
npm run apk:windows --workspace @yawar/mobile   # mobile/dist/yawar-debug.apk
```
Where the SDK is local (Linux, macOS, or a checkout on a Windows drive), with `ANDROID_HOME` and `JAVA_HOME`
set:
```bash
npm run build --workspace @yawar/mobile
cd mobile/android && ./gradlew assembleDebug    # app/build/outputs/apk/debug/app-debug.apk
```
The Keycloak and API addresses are fixed at build time: set the `VITE_*` variables of `web/.env.example`
(the client id is always `yawar-mobile`) before building for another environment.

## Run on the emulator
Start the local stack of Yawar-Backend (`make up PROFILE=platform` and `make keycloak-import`), then forward
the two ports the app uses (repeat after restarting the emulator). With `adb.exe` of the Windows SDK:
```powershell
adb reverse tcp:8000 tcp:8000   # API Gateway
adb reverse tcp:8080 tcp:8080   # Keycloak
adb install -r <path to the APK>
```

## Test
The sign-in test runs on a started emulator or device with the local stack up:
```bash
npm run e2e:windows --workspace @yawar/mobile   # WSL: installs the APK, forwards the ports, runs the tests
npm run e2e --workspace @yawar/mobile           # local SDK: APK installed and ports forwarded beforehand
```
It clears the app's data and leaves a fictional `e2e.mobile.*@example.test` account in the local realm.

## Known limits
- Google sign-in does not work: Google refuses embedded WebViews. Email and password work.
- The email verification link opens in the browser: verify there, then sign in inside the app.
- A restart of the app shows it signed out until "Iniciar sesión" is tapped.
- Only a debug APK, with the default Capacitor icon and splash screen; no push notifications yet.
- A build for a Keycloak on another host than `localhost` has not been tested.
