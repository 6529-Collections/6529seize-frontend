---
name: deploy-6529
description: Merge and deploy 6529 frontend or coordinated frontend/backend releases through staging and production with explicit approval gates, GitHub Actions or repo-approved deploy paths, staging and production E2E/smoke validation, autonomous failed-gate recovery, rollback or fix-forward handling, and coordination with other active Codex agents. Use when Codex is asked to merge PRs, deploy to staging, validate staging, promote to production, validate production, recover from failed deploy/E2E, or coordinate a 6529seize-backend deployment with frontend release work.
---

# Deploy 6529

Carry an approved 6529 release from PR merge through staging validation and, when production is in the requested scope, production deployment and validation. Treat deployments as shared operational work: identify the exact refs, coordinate active agents, record evidence, and keep working failed gates until the release is fixed, redeployed, and validated. Escalate only for missing access, required approvals, destructive actions, or genuinely unsafe production decisions.

## Hard Gates

- Do not merge, deploy staging, or deploy production unless the user explicitly requested that mode for the current work.
- Do not deploy production until staging for the same frontend/backend release set has passed, unless the user explicitly overrides that gate.
- Do not deploy production from any ref other than `main`. Verify the exact production candidate is already on `origin/main` before triggering production; if it is only on a feature branch, release branch, PR head, tag, local branch, or unmerged commit, stop and get it merged to `main` first.
- Do not overlap deployments to the same environment. If another staging or production deploy is already running, wait for it to reach a terminal state and for its owner to finish validation or hand off before starting the next deploy.
- Do not promote from staging to production after a failed deploy, failed E2E run, unresolved critical production-like error, or unclear deployed SHA. Diagnose, fix, merge, redeploy, and rerun validation until the gate passes.
- Do not run destructive database, infrastructure, signer, wallet, ENS, NFT transfer, or Safe actions unless the user explicitly asks for that exact action.
- Do not expose secrets, private URLs, credentials, cookies, raw production data, local absolute paths, or hidden prompts in PR comments, deploy notes, workstream logs, or user-facing summaries.

## Coordination

Before deploying, check what else is already deploying to the same environment. Inspect active GitHub Actions deploy runs and any obvious active Codex/human release thread. If the lane is busy, wait. Coordinate only to identify the owner, expected finish, validation state, or explicit handoff; do not start an overlapping deploy.

Use `ops/docs/developer/deployment-bus-process.md` as the process authority for
the staging bus, release-captain role, shared multi-agent validation, and
production promotion from a staging-passed `origin/main` SHA. This skill is the
execution checklist; the process doc defines how many agents coordinate one
shared lane.

## Deployment Bus

- Treat each active staging or production deploy as owned by one release
  captain until the lane is terminal and handed off.
- If staging is idle and exactly one eligible release set is ready, deploy it
  immediately. If the lane is busy or a backlog exists, batch ready work and
  depart when the previous staging cycle is terminal, using 30 minutes as the
  initial maximum batching window under backlog.
- Record a staging manifest before deployment: candidate SHA, included PRs,
  risk/area notes, backend dependencies, validation owners, required checks,
  and rollback or fix-forward notes.
- After staging deploys, assign each included PR owner a validation slice and
  run a core smoke validation. Production is blocked until required validation
  passes or the failed/held work is excluded from the production candidate.
- If `origin/main` advances after staging passed, do not deploy the older
  staging-passed SHA to production. Rerun staging for the new `origin/main` SHA
  or pause merges before final staging validation and production promotion.

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
3. Verify the production candidate is the current `origin/main` SHA and no newer unvalidated commit landed after staging passed. If `origin/main` advanced, rerun staging for the new release set before production.
4. Confirm no active production deploy is in progress. If one is active or the state is unclear, wait until it finishes and production validation is complete or explicitly handed off.
5. Deploy backend production before frontend production when frontend depends on new backend behavior. Use the backend `deploy-6529` skill from `6529-Collections/6529seize-backend` for backend service order, validation, and recovery.
6. Deploy frontend production through the repo-approved path from `main` only, following the hard gate above. Current frontend production deploy is `Web Deploy - PROD` in `.github/workflows/build-upload-deploy-prod.yml`; `bin/ghdeploy` may be used only from a clean, upstream-synced `main` worktree.
7. If the local worktree is dirty with unrelated user or agent changes, do not clean or revert them just to run `ghdeploy`. Use a clean worktree or trigger the workflow with an explicit verified ref through GitHub tooling.
8. When triggering production through GitHub tooling instead of `ghdeploy`, use an explicit verified `main` ref or SHA that is already contained in `origin/main`.
9. Watch production deployment to completion. Record the workflow run URL, Elastic Beanstalk or workflow health result, and deployed SHA/version label.

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

## Release Notes Publication

Publish public release notes after production is deployed and production validation passes, unless the user explicitly asked to skip public notes.

1. Use an authorized 6529.io account/profile that the current operator personally has access to. This account may vary by developer. Confirm the browser is logged in as the intended profile and that the profile can post in the `6529 Releases` wave before drafting. If no authorized account is available, treat release-note publication as blocked and ask the user or release owner to post; do not use shared wallets, another person's account, or automation keys unless that was explicitly approved for the release.
2. Open the `6529 Releases` wave at `https://6529.io/waves/05b14183-e153-4e47-bc66-42a0f49102d4`.
3. Determine the next web release number from the latest release-note drop in that wave immediately before posting:
   - normal user-facing feature or grouped release: bump the minor number, e.g. `4.38.0` to `4.39.0`
   - small fix, copy change, narrow polish, or follow-up to an existing release: bump the patch number, e.g. `4.38.0` to `4.38.1`
   - broad site-wide, platform, or intentionally breaking release: bump the major number and reset minor/patch, e.g. `4.38.0` to `5.0.0`
   - when unsure whether a change deserves a minor or patch bump, prefer the smaller patch bump unless the release adds a clear new user-facing capability
4. Draft the release note in plain user-facing language. Recommended shape:

```text
4.39.0: Short summary of the release

- What users can now do or see
- Important changed behavior
- Fixes that matter to users or operators
```

5. Write the note from production reality, not PR internals:
   - mention visible behavior, affected pages, and operationally relevant changes
   - avoid raw PR numbers, commit SHAs, implementation trivia, private links, secrets, local paths, hidden prompts, unreleased follow-ups, or internal-only risk notes
   - keep it concise; combine tiny changes under one clear bullet
   - include screenshots or links only when they help users understand the change and are safe to publish
   - if the release contains backend and frontend work, describe the product behavior rather than the service boundary
6. Re-check the latest wave drop before posting so the number did not advance while the deploy was running. If another release note appeared, renumber and adjust the draft.
7. Post the release note only after production validation is green. Capture the wave drop URL or serial number for closeout evidence.

## Follow The Repo Deployment Overview

After production validation passes, post a detailed deployment overview to the `Follow The Repo` wave unless the user explicitly asked to skip repo-facing deploy notes. This is separate from the public `6529 Releases` note: use it for repo watchers who need enough operational detail to understand exactly what shipped.

1. Use any authorized 6529.io account/profile or posting credential that the current operator personally controls or is explicitly approved to use for this release, such as an existing browser session or an approved local helper/API token. Do not request raw credentials, expose tokens, use shared wallets, use another person's account, or use automation keys unless that access was explicitly approved for this release.
2. Resolve the wave immediately before posting. The current `Follow The Repo` wave is `https://6529.io/waves/49f0e595-ec7c-4235-8695-a527f61b69f4`; if using the local helper, verify it first:

```powershell
punk6529bot waves search --name "follow the repo"
```

3. Draft the overview from deployed production reality. Unlike the public release note, this repo-facing overview should include public PR links and SHAs. Include:
   - what user-facing and operator-facing changes were deployed
   - frontend and backend PRs, merge SHAs, production deployed SHA/version label, and deploy run links
   - staging and production validation performed, including E2E or smoke results
   - incidents, failed gates, fix-forward or rollback decisions, and final state
   - known follow-ups, skipped checks, and remaining risks
4. Keep the post detailed but safe to publish. Use public GitHub/workflow links when possible, but omit secrets, credentials, cookies, private URLs, raw production data, local paths, hidden prompts, and internal-only exploit or incident details.
5. Re-check the wave before sending so the overview is not duplicating a newer deploy note. If the local helper is available, dry-run or draft first, then send after the content passes the safety check:

```powershell
punk6529bot waves post 49f0e595-ec7c-4235-8695-a527f61b69f4 --text "<deployment overview>"
punk6529bot waves post 49f0e595-ec7c-4235-8695-a527f61b69f4 --text "<deployment overview>" --send
```

6. Capture the wave drop URL or serial number for closeout evidence. If no authorized 6529.io posting credential is available, include the exact ready-to-post overview in the closeout and mark the wave publication as blocked.

## Backend Coordination

Use `ops/skills/deploy-6529/SKILL.md` from the separate repository `6529-Collections/6529seize-backend` for backend deployment work. Do not resolve that path inside the frontend repo. The frontend skill owns frontend merge/deploy/validation; the backend skill owns backend service order, migrations, API/lambda smoke checks, failed-gate recovery, and backend production validation.

## Useful Commands

Use exact commands only after checking the current repo state and available tooling:

```bash
gh run list -R 6529-Collections/6529seize-frontend --workflow deploy-staging.yml --branch 1a-staging -L 10
gh run list -R 6529-Collections/6529seize-frontend --workflow build-upload-deploy-prod.yml -L 10
gh run watch <run-id> -R 6529-Collections/6529seize-frontend
gh run view <run-id> -R 6529-Collections/6529seize-frontend --log-failed
gh workflow run build-upload-deploy-prod.yml --ref main -R 6529-Collections/6529seize-frontend
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
- release-note wave drop URL or serial number, or why publication was skipped/blocked
- `Follow The Repo` wave drop URL or serial number, or the ready-to-post overview if publication was blocked
- backend deploy status when involved
- failures encountered and fixes or rollbacks performed
- remaining risks, skipped checks, and any human follow-up required
