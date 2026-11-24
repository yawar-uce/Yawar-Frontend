## 🎯 Summary
<2–4 sentences: what problem this solves and the outcome.>

## 🔗 Jira
- Task: [YAW-<n>](https://yawarblood26.atlassian.net/browse/YAW-<n>) — <task title>
- Subtasks: YAW-<a>, YAW-<b>

## 🧩 Type of change
- [ ] ✨ Feature  - [ ] 🐛 Fix  - [ ] 🧱 Infrastructure  - [ ] 👷 CI/CD  - [ ] 📝 Docs  - [ ] ✅ Tests  - [ ] ♻️ Refactor

## 🛠️ What was done
- <bullet per meaningful change, with file/folder paths>
- <design decisions and why>

## 🧪 How to test
> Step by step, copy-paste ready, from a clean clone on `dev`.
1. `git fetch origin && git switch <branch>`
2. `<setup command, e.g. cp deploy/local/.env.example deploy/local/.env>`
3. `<run command, e.g. make up && make ps>`
4. Expected result: <exact output / URL / status to check>
5. Cleanup: `<e.g. make down>`

## ✅ Evidence
<Verification actually run: commands + key output lines (code block). Screenshots for UI changes. Coverage %, test counts, Trivy/gitleaks result.>

## 📋 Checklist
- [ ] Branch, commits and title follow the `yawar-pr` format (gitmoji + Conventional Commits + YAW key)
- [ ] One task only in this PR
- [ ] Unit/integration tests added or updated; coverage ≥ 70 % (V-01)
- [ ] OpenAPI/AsyncAPI updated if contracts changed (V-02)
- [ ] No HIGH/CRITICAL Trivy findings (V-03); gitleaks clean
- [ ] No secrets, no real personal data, only `*.example` env files
- [ ] README / docs / CHANGELOG updated

## ⚠️ Risks and rollback
<What could break; how to revert (e.g. revert the PR, `make reset`).>

## 📝 Notes for the reviewer
<Known limitations, follow-ups, manual steps.>
