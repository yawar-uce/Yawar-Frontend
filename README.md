# Yawar — Frontend

Monorepo of the Yawar web apps. React + Vite, deployed to S3 + CloudFront.

## Layout
```
apps/        one folder per front (web: login + donor portal)
packages/    shared UI components and API clients
docs/        branching, QA reports
.github/     workflows, PR template, CODEOWNERS
```

## Sprint 2
| Front | Backend it uses | Jira |
|---|---|---|
| Login (Keycloak OIDC) | Identity / API Gateway | EP-07 |
| Donor registration and profile | `ms-donantes` | EP-01 |

## Workflow
See [docs/BRANCHING.md](docs/BRANCHING.md): `feature/YAW-xx` → `dev` → `qa` → `production`.
Promotion to `production` requires approval from @JuanGuevara90 (`professor-approval` check).
