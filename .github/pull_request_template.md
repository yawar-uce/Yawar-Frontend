## 🎯 Summary
<2–4 sentences: what problem this solves and the outcome.>

## 🔗 Jira
- Task: [YAW-<n>](https://yawarblood26.atlassian.net/browse/YAW-<n>) — <task title>
- Subtasks: YAW-<a>, YAW-<b>

## 🧩 Type of change
<!-- Tick every type that applies with - [x] -->
- [ ] ✨ Feature
- [ ] 🐛 Fix
- [ ] 🧱 Infrastructure
- [ ] 👷 CI/CD
- [ ] 📝 Docs
- [ ] ✅ Tests
- [ ] ♻️ Refactor

## 🛠️ What was done
- <bullet per meaningful change, with file/folder paths>
- <design decisions and why>

## 🧪 How to test
> Copy-paste ready, from a clean clone on `dev`: `git fetch origin && git switch <branch> && npm ci`.
> Write "N/A — <reason>" for a layer that does not apply.

**Unit** — one component/function in isolation (Vitest + Testing Library)
```bash
npm test
```
Expected: `Tests  <n> passed (<n>)`

**Integration** — N/A — the frontend has no integration layer; real backend calls are covered by the functional tests.

**Functional / acceptance** — one Playwright test per Gherkin scenario of the story, against the local stack
```bash
npm run e2e
```
Expected: <scenarios that pass, e.g. hu01_sc1 … hu01_sc4>

**Manual**
1. `<setup, e.g. start the backend stack (make up in Yawar-Backend) and npm run dev>`
2. `<action, e.g. open http://localhost:5173 and sign in as a donor>`
3. Expected result: <exact screen / message / URL to check>
4. Cleanup: `<e.g. stop npm run dev>`

## ✅ Evidence
<!-- Only verification actually run, with real output lines -->
```text
Unit:         Tests  <n> passed (<n>)
Functional:   <n> passed (Playwright)
Coverage:     <n> % (Vitest, threshold 70 %)
Trivy:        0 HIGH, 0 CRITICAL
gitleaks:     no leaks found
```

## 📸 Screenshots (added by Wadri)
<!-- Exact screenshots to take for this PR; left unchecked, Wadri uploads them -->
- [ ] Unit tests green (`npm test`)
- [ ] Playwright report HU-<xx>
- [ ] Vitest coverage ≥ 70 %
- [ ] <screen, e.g. login page>

## 📋 Checklist
- [ ] Branch, commits and title follow the `yawar-pr` format (gitmoji + Conventional Commits + YAW key)
- [ ] One task only in this PR
- [ ] Unit and functional tests added or updated; coverage ≥ 70 % (V-01)
- [ ] OpenAPI/AsyncAPI updated if contracts changed (V-02)
- [ ] No HIGH/CRITICAL Trivy findings (V-03); gitleaks clean
- [ ] No secrets, no real personal data, only `*.example` env files
- [ ] README / docs / CHANGELOG updated

## ⚠️ Risks and rollback
<What could break; how to revert (e.g. revert the PR, `make reset`).>

## 📝 Notes for the reviewer
<Known limitations, follow-ups, manual steps.>
