# Branching, versioning and Jira integration

## Flow

```
feature/YAW-xx-name ──PR──▶ dev ──PR──▶ qa ──PR──▶ production
   (from dev)            (In DEV)    (QA)        (Done, approved by professor)
```

| Branch | Who merges | Requirements | Jira status after deploy |
|---|---|---|---|
| `dev` | team | PR, `ci` + `branch-guard` green, Jira key in branch/title | In DEV |
| `qa` | team | PR only from `dev`, `ci` + `branch-guard` green | QA |
| `production` | **@JuanGuevara90** approves | PR only from `qa`, `professor-approval` check (his approval on the latest commit), QA report | Done |

Direct pushes, force pushes and deletion are blocked on the three branches.

## Naming
- Branches: `feature/YAW-58-pilot`, `fix/YAW-70-login-error`, `chore/YAW-12-ci`
- Commits: `YAW-58 add health endpoint` (the key links the commit to Jira)
- PR title: `YAW-58 Pilot: health endpoint`

## Versions and tags (SemVer, per microservice)
- qa release candidate: `ms-donantes-v0.1.0-rc.1`
- production release: `ms-donantes-v0.1.0`
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
