# Yawar desktop

A minimal Electron wrapper over the web build (YAW-220): same screens, same API Gateway, same sign-in.

## How it works
- `src/main.js` serves the build on `http://localhost:5180` (loopback only) and shows it in one window.
- Sign-in is Authorization Code + PKCE with its own public Keycloak client, `yawar-desktop`
  (Yawar-Backend, `deploy/keycloak`). Tokens stay in memory, as on the web.
- The window shows only the app, Keycloak and Google's sign-in page; other web links open in the system
  browser.
- The API Gateway must allow the origin `http://localhost:5180` in its CORS configuration (the local
  defaults do).

## Run it
From the repository root, with the local stack of Yawar-Backend running
(`make up PROFILE=platform` and `make keycloak-import`):
```bash
npm ci
npm run build --workspace @yawar/desktop   # web build for the desktop client, in desktop/dist
npm start --workspace @yawar/desktop
```

## Windows build
```bash
npm run dist:win --workspace @yawar/desktop   # desktop/dist/release/Yawar-<version>-win-x64.zip
```
Unzip it on Windows and open `Yawar.exe`. The Keycloak and API addresses are fixed at build time: set the
`VITE_*` variables of `web/.env.example` (the client id is always `yawar-desktop`) before building for
another environment.

## Test
`npm test` (repository root) covers the local server and the navigation rules. The sign-in test needs the
local stack:
```bash
npm run build --workspace @yawar/desktop
npm run e2e --workspace @yawar/desktop
```
Set `DESKTOP_APP_PATH` to a packaged `Yawar.exe` to test the Windows build instead of the sources.
Each run leaves a fictional `e2e.desktop.*@example.test` account in the local realm.

## Known limits
- Google sign-in is not verified: Google may refuse to sign in inside an embedded window. Email and
  password work.
- The email verification link opens in the system browser: verify there, then sign in inside the app.
- The Windows zip is not signed (SmartScreen warns on first run) and has the default Electron icon.
- No macOS or Linux packages yet.
