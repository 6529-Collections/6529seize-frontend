---
name: deploy-6529
description: Merge and deploy 6529 frontend or coordinated frontend/backend releases through staging and production with explicit approval gates, GitHub Actions or repo-approved deploy paths, staging and production E2E/smoke validation, autonomous failed-gate recovery, rollback or fix-forward handling, and coordination with other active Codex agents. Use when Codex is asked to merge PRs, deploy to staging, validate staging, promote to production, validate production, recover from failed deploy/E2E, or coordinate a 6529seize-backend deployment with frontend release work.
---

# Deploy 6529

Carry an approved 6529 release from PR merge through staging validation and, when production is in the requested scope, production deployment and validation. Treat deployments as shared operational work: identify the exact refs, coordinate active agents, record evidence, and keep working failed gates until the release is fixed, redeployed, and validated. Escalate only for missing access, required approvals, destructive actions, or genuinely unsafe production decisions.

## Hard Gates

- Do not merge, deploy staging, or deploy production unless the user explicitly requested that mode for the current work.
- Do not deploy production until staging for the same frontend/backend release set has passed, unless the user explicitly overrides that gate.
- Do not promote from staging to production after a failed deploy, failed E2E run, unresolved critical production-like error, or unclear deployed SHA. Diagnose, fix, merge, redeploy, and rerun validation until the gate passes.
- Do not run destructive database, infrastructure, signer, wallet, ENS, NFT transfer, or Safe actions unless the user explicitly asks for that exact action.
- Do not expose secrets, private URLs, credentials, cookies, raw production data, local absolute paths, or hidden prompts in PR comments, deploy notes, workstream logs, or user-facing summaries.

## Coordination

Before deploying, check what else is already deploying to the same environment. Inspect active GitHub Actions deploy runs and any obvious active Codex/human release thread. If the lane is busy, wait or coordinate just enough to avoid overlapping deploys.

## Preflight

1. Identify the release set:
   - frontend PRs and target branch
   - backend PRs, migrations, generated API/OpenAPI changes, feature flags, and deploy order
   - expected user-facing behavior to validate
2. Inspect current deploy docs and workflows before acting:
   - frontend staging: `.github/workflows/deploy-staging.yml`, `scripts/staging.sh`, `bin/6529`
   - frontend production: `.github/workflows/build-upload-deploy-prod.yml`, `bin/ghdeploy`
   - package and wrapper notes: `ops/docs/developer/pnpm-and-socket-firewall.md`
   - backend: when backend is involved, use `ops/skills/deploy-6529/SKILL.md` from the separate repository `6529-Collections/6529seize-backend` as the backend deployment authority. Do not resolve that path inside the frontend repo.
3. Verify PR readiness before merge:
   - agent review complete
   - review bots addressed or explicitly deferred
   - required CI and DCO passing
   - human approval present when required
   - release risk and rollback/fix-forward plan understood
4. Use the repo-local `6529` wrapper for frontend project commands in release notes, checked-in docs, CI descriptions, and deploy instructions.

## Merge

1. Confirm the PR is the one the user asked to ship.
2. Re-check latest head SHA, approvals, required checks, and unresolved review threads.
3. Merge using the repo-approved GitHub path and record:
   - PR number
   - merge commit SHA
   - target branch
   - included backend/frontend dependency notes
4. If merge fails, resolve the merge blocker through the normal PR cycle before deployment. Re-check CI and review state after every fix.

## Staging Deployment

1. Confirm no active staging deploy is already using the lane.
2. Deploy the exact intended frontend merge commit to staging. Current frontend staging is driven by the `1a-staging` branch and `.github/workflows/deploy-staging.yml`; the workflow runs `./bin/6529 staging` on the staging host through SSM and verifies the deployed SHA. Do not force-push, reset, or replace `1a-staging` over another active candidate without coordination.
3. If staging requires backend changes, use the backend `deploy-6529` skill from `6529-Collections/6529seize-backend` to deploy backend staging first when the frontend depends on new API behavior.
4. Watch the staging workflow to a terminal state. Capture the run URL, status, and deployed SHA.
5. If the staging deploy fails, inspect logs, identify the owner layer, fix through the normal PR cycle, merge the fix, and redeploy staging from the new SHA. Keep iterating until staging deploys cleanly or a safety/access boundary requires user input.

## Staging E2E

1. Run the strongest deployed-staging validation available. Inspect package scripts and Playwright config before assuming a target-specific command exists.
2. If a staging E2E script exists, use it. If not, use Playwright or browser automation against `https://staging.6529.io` for the release-critical flows and record that no dedicated staging E2E script exists.
3. Cover the changed behavior plus core smoke:
   - page loads and navigation for touched routes
   - wallet/auth-sensitive paths when relevant, using approved test identity only
   - backend/API responses for touched contracts
   - posting, upload, media, delegation, or generated-model flows when touched
   - console/network errors that indicate release regressions
4. If staging E2E fails, hold production promotion and work the fix loop:
   - release bug: fix frontend/backend, test locally, open/update PR, merge, redeploy staging, and rerun E2E
   - environment/data issue: document evidence, coordinate owner, apply or request the correction, and rerun after correction
   - flaky test/tool issue: rerun once with evidence, then harden the test or investigate the app if the signal repeats
   - user-visible breakage: treat it as a release bug even if the automated test is noisy

## Production Deployment

1. Proceed to production when the user already asked to take the release through production, such as "take it all the way through prod." Ask only when the current request did not include production deployment.
2. Reconfirm staging passed for the same SHAs or the same ordered frontend/backend release set.
3. Confirm no active production deploy is in progress.
4. Deploy backend production before frontend production when frontend depends on new backend behavior. Use the backend `deploy-6529` skill from `6529-Collections/6529seize-backend` for backend service order, validation, and recovery.
5. Deploy frontend production through the repo-approved path. Current frontend production deploy is `Web Deploy - PROD` in `.github/workflows/build-upload-deploy-prod.yml`; `bin/ghdeploy` triggers that workflow for a clean, upstream-synced branch.
6. If the local worktree is dirty with unrelated user or agent changes, do not clean or revert them just to run `ghdeploy`. Use a clean worktree or trigger the workflow with an explicit verified ref through GitHub tooling.
7. Watch production deployment to completion. Record the workflow run URL, Elastic Beanstalk or workflow health result, and deployed SHA/version label.

## Production E2E And Watch

1. Validate `https://6529.io` after production reports healthy.
2. Run the production-safe E2E or smoke flow for changed behavior. Avoid creating public posts, purchases, transfers, signer changes, or irreversible data unless the user explicitly requested that live action.
3. Check high-signal production health:
   - changed route loads
   - API calls succeed
   - critical console/network errors absent
   - static assets load from the expected build
   - backend/frontend version expectations match when visible
4. If production validation fails:
   - coordinate immediately and keep ownership of the incident loop
   - decide rollback versus fix-forward based on severity and reversibility, then execute the chosen path if it is within existing authorization
   - do not start unrelated deploys until production is stable or explicitly handed off
   - after rollback or fix-forward, rerun production validation until the failure is resolved or a safety/access boundary requires user input
   - record the incident evidence, chosen action, and final state

## Backend Coordination

Use `ops/skills/deploy-6529/SKILL.md` from the separate repository `6529-Collections/6529seize-backend` for backend deployment work. Do not resolve that path inside the frontend repo. The frontend skill owns frontend merge/deploy/validation; the backend skill owns backend service order, migrations, API/lambda smoke checks, failed-gate recovery, and backend production validation.

## Useful Commands

Use exact commands only after checking the current repo state and available tooling:

```bash
gh run list -R 6529-Collections/6529seize-frontend --workflow deploy-staging.yml --branch 1a-staging -L 10
gh run list -R 6529-Collections/6529seize-frontend --workflow build-upload-deploy-prod.yml -L 10
gh run watch <run-id> -R 6529-Collections/6529seize-frontend
gh run view <run-id> -R 6529-Collections/6529seize-frontend --log-failed
gh workflow run build-upload-deploy-prod.yml --ref <verified-branch-or-tag> -R 6529-Collections/6529seize-frontend
```

For local validation in this Windows Codex environment:

```powershell
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
6529 run test:e2e
```

## Closeout

Report:

- merged PRs and SHAs
- staging deploy run, deployed SHA, and E2E result
- production deploy run, deployed SHA, and E2E result
- backend deploy status when involved
- failures encountered and fixes or rollbacks performed
- remaining risks, skipped checks, and any human follow-up required
