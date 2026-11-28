# Yawar — Frontend

Monorepo of the Yawar web apps. React + Vite, deployed to S3 + CloudFront.

## Layout
npm workspaces; install once from the repo root.
```
web/         React + Vite app (login + donor portal)
shared/      code reused by every client (roles, API client)
desktop/     Electron wrapper around the web build
mobile/      Capacitor Android wrapper around the web build
docs/        branching, QA reports
.github/     workflows, PR template, CODEOWNERS
```

## Run it
Node.js 22.12 or newer.
```bash
npm ci
npm run dev      # web app on http://localhost:5173
npm run lint
npm test         # Vitest with coverage (threshold 70 %)
npm run build    # type check + production build in web/dist
```

## Sign-in (web)
Authorization Code + PKCE against the Keycloak realm of Yawar-Backend (client `yawar-web`). Start that
stack first (`make up` in Yawar-Backend); the app must run on http://localhost:5173, the registered
redirect URI. Defaults target the local stack; override them with the variables in `web/.env.example`.
Tokens stay in memory: a reload restores the session with a silent check against Keycloak. Any host that
serves the build must answer unknown paths (such as `/callback`) with `index.html`.

## Sign-up and donor home
`/signup` offers "Continuar con Google" or email plus consent; Keycloak creates the account, the password
and the recorded consent. `/donor` reads `GET /api/v1/donors/me` through the API Gateway
(`VITE_API_URL`, default http://localhost:8000).

## End-to-end tests (web)
They run against the local stack, so CI does not run them. From an up-to-date `dev` of Yawar-Backend:
`make up PROFILE=platform` and `make keycloak-import`. Then, here:
```bash
npx playwright install chromium   # once
npm run e2e                       # report in web/playwright-report
```
Each run creates a fictional `e2e.*@example.test` account. Set `E2E_KEYCLOAK_ADMIN_PASSWORD` (and
`E2E_KEYCLOAK_ADMIN_USER` if it is not `admin`) to remove it from Keycloak afterwards; its donor row
stays in the local `donors_db`.

## Desktop
`desktop/` wraps the web build in Electron, with its own PKCE client (`yawar-desktop`) and a Windows
zip (`npm run dist:win --workspace @yawar/desktop`). See [desktop/README.md](desktop/README.md).

## Sprint 2
| Front | Backend it uses | Jira |
|---|---|---|
| Login (Keycloak OIDC) | Identity / API Gateway | EP-07 |
| Donor registration and profile | `ms-donors` | EP-01 |

## Workflow
See [docs/BRANCHING.md](docs/BRANCHING.md): `feature/YAW-xx` → `dev` → `qa` → `production`.
Promotion to `production` requires approval from @JuanGuevara90 (`professor-approval` check).
