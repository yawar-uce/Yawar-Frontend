# Branching, versioning and Jira integration

## Flow

```
feature/YAW-xx-name ──PR──▶ dev ──PR──▶ qa ──PR──▶ production
   (from dev)            (In DEV)    (QA)        (Done, approved by professor)
```

| Branch | Who merges | Requirements | Jira status after deploy |
|---|---|---|---|
| `dev` | team | PR, `ci` + `branch-guard` green, Jira key and commit/PR format (see below) | In DEV |
| `qa` | team | PR only from `dev`, `ci` + `branch-guard` green | QA |
| `production` | **@JuanGuevara90** approves | PR only from `qa`, `professor-approval` check (his approval on the latest commit), QA report | Done |

Direct pushes, force pushes and deletion are blocked on the three branches.

## Commit and PR format

Gitmoji + Conventional Commits, with the Jira key at the end (it links the commit to Jira).
PRs are merged with **Rebase and merge**, so every commit lands in `dev` as written.

```
<emoji> <type>(<scope>): <subject> (YAW-<n>)

[optional body: what and why, wrapped at 72 chars]

[optional footer: Refs: YAW-<n> | BREAKING CHANGE: <description>]
```

- English, imperative mood, lowercase subject, no final period, header ≤ 72 characters.
- One logical change per commit; subtasks may be separate commits, each with its own key.
- No `Co-Authored-By`, "Generated with…" lines or tool attribution.

| Emoji | Type | Use for |
|---|---|---|
| ✨ | `feat` | new feature or endpoint |
| 🐛 | `fix` | bug fix |
| 🔒️ | `fix` | security fix (scope stays the component) |
| 📝 | `docs` | documentation, README, ADR, CHANGELOG |
| 🎨 | `style` | formatting only, no logic change |
| ♻️ | `refactor` | code change without behaviour change |
| ⚡️ | `perf` | performance |
| ✅ | `test` | add or fix tests |
| 🏗️ | `build` | build system, Maven/npm, Dockerfile |
| 👷 | `ci` | GitHub Actions, CI scripts |
| 🔧 | `chore` | config files, Makefile, tooling |
| 🗃️ | `feat` / `fix` | database migrations (Flyway) |
| 🧱 | `build` | infrastructure as code (Terraform, Helm, kind, compose) |
| ⬆️ | `build` | dependency upgrade |
| ⏪️ | `revert` | revert a previous commit |
| 🚀 | `release` | promotion PRs and version tags only |

Scopes — Backend: `ms-donors`, `platform`, `gateway`, `keycloak`, `ad`, `compose`, `kind`, `helm`,
`terraform`, `ci`, `docs`, `deps`, `qa`. Frontend: `web`, `auth`, `ui`, `api-client`, `ci`, `docs`,
`deps`, `qa`.

Examples:
```
✨ feat(ms-donors): add GET /donors/me with lazy profile creation (YAW-157)
🧱 build(compose): add postgres, rabbitmq, keycloak and mailpit (YAW-11)
👷 ci(ci): add jacoco coverage gate at 70% (YAW-79)
🔒️ fix(gateway): reject tokens without audience claim (YAW-33)
📝 docs(docs): document local environment startup (YAW-65)
```

**Branches:** `<type>/YAW-<n>-<short-kebab-slug>`, type ∈ `feature | fix | chore | docs | ci | build | test`
(e.g. `feature/YAW-36-ms-donors-skeleton`, `chore/YAW-11-local-environment`).

**Pull requests:** one Jira task per PR, base `dev`. The title uses the commit header format for the
whole task (e.g. `🧱 build(compose): local environment with docker compose (YAW-11)`) and the body
follows `.github/pull_request_template.md`. Promotion PRs: `🚀 release(qa): promote dev to qa — <YYYY-MM-DD>`
and `🚀 release(production): promote qa to production — <version tag>`.

**Enforcement:** on PRs to `dev`, `branch-guard` checks the PR title and every commit header
(`git log --no-merges --format=%s origin/dev..HEAD`) against:
```
^(✨|🐛|🔒️|📝|🎨|♻️|⚡️|✅|🏗️|👷|🔧|🗃️|🧱|⬆️|⏪️|🚀) (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|release)(\([a-z0-9-]+\))?!?: .+ \(YAW-[0-9]+(, YAW-[0-9]+)*\)$
```
Several emojis carry an invisible variation selector (U+FE0F): copy them from the table above.
Promotion PRs to `qa`/`production` skip this check. To fix a failing commit, reword it on the feature
branch and push with `--force-with-lease`.

## Versions and tags (SemVer, per microservice)
- qa release candidate: `ms-donors-v0.1.0-rc.1`
- production release: `ms-donors-v0.1.0`
- Docker images in ECR are tagged with the commit SHA (immutable); the release tag points to that SHA.

## Jira automation
| Event in GitHub | Jira transition |
|---|---|
| Branch created with key | → In Progress |
| PR to `dev` opened | → In Review |
| Deployment to `dev` succeeded | → In DEV |
| Deployment to `qa` succeeded | → QA |
| Deployment to `production` succeeded | → Done |
| Build failed | → Build Broken (+ comment) |
| Build fixed | → In Review |

Requires the **GitHub for Jira** app and GitHub environments named `dev`, `qa`, `production`.

## Professor approval (qa → production only)
The `production-approval` workflow runs only on PRs targeting `production`:
it requests @JuanGuevara90's review and the required check `professor-approval`
passes only when he has approved the latest commit. PRs to `dev` and `qa` never notify him.
