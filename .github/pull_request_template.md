## Jira
<!-- Required: the Jira key links this PR to the board (e.g. YAW-58) -->
YAW-

## Type
- [ ] feature  - [ ] fix  - [ ] chore/devops  - [ ] docs  - [ ] promotion (dev → qa / qa → production)

## Summary
<!-- What changes and why -->

## Evidence
<!-- Screenshots, logs, test output, coverage report -->

## Checklist
- [ ] Branch name contains the Jira key (`feature/YAW-xx-short-name`)
- [ ] Commits reference the Jira key
- [ ] Unit tests added/updated, coverage ≥ 70 % (V-01)
- [ ] Contracts (OpenAPI/AsyncAPI) updated if the API changed (V-02)
- [ ] No HIGH/CRITICAL findings in Trivy (V-03)
- [ ] Documentation updated (README / Confluence / ADR)

### Only for promotion to `production`
- [ ] QA report attached (V-05 stress, V-07 recovery, V-09 ZAP)
- [ ] Release tag and notes prepared
- [ ] Approved by the professor (`professor-approval` check green)
