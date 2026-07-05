---
name: deploy-6529
description: Merge and deploy 6529 frontend or coordinated frontend/backend releases through staging and production with explicit approval gates, GitHub Actions or repo-approved deploy paths, staging and production E2E/smoke validation, autonomous failed-gate recovery, rollback or fix-forward handling, and coordination with other active Codex agents. Use when Codex is asked to merge PRs, deploy to staging, validate staging, promote to production, validate production, recover from failed deploy/E2E, or coordinate a 6529seize-backend deployment with frontend release work.
---

# Deploy 6529

Carry an approved 6529 release through staging validation and, when production is in the requested scope, production deployment and validation. Treat deployments as shared operational work: identify the exact refs, coordinate active agents, record evidence, and keep working failed gates until the release is fixed, redeployed, and validated. Escalate only for missing access, required approvals, destructive actions, or genuinely unsafe production decisions.

## Hard Gates

- Do not merge, deploy staging, or deploy production unless the user explicitly requested that mode for the current work.
- Treat Draft PRs as blocked. Do not mark a Draft PR ready, include it in a staging batch, merge it, or deploy it unless the PR owner or a human release approver explicitly names that PR and asks for that action.
- Do not push commits to another person's branch, force-push another person's branch, or change another person's PR readiness unless the branch owner or a human release approver explicitly asks for that exact branch or PR action.
- Do not deploy production until staging for the same frontend/backend release set, or the same resulting patch set after the production merge, has passed unless the user explicitly overrides that gate.
- Do not deploy production from any ref other than `main`. Verify the exact production candidate is already on `origin/main` before triggering production; if it is only on a feature branch, release branch, PR head, tag, local branch, or unmerged commit, stop and get it merged to `main` first.
- Never merge `1a-staging` into `main` to promote a release. Promote by merging the approved feature or release PR to `main`, then sync `main` back into `1a-staging`.
- Do not overlap deployments to the same environment. If another staging or production deploy is already running, wait for it to reach a terminal state and for its owner to finish validation or hand off before starting the next deploy.
- Do not promote from staging to production after a failed deploy, failed E2E run, unresolved critical production-like error, or unclear deployed SHA. Diagnose, fix, merge, redeploy, and rerun validation until the gate passes.
- Do not run destructive database, infrastructure, signer, wallet, ENS, NFT transfer, or Safe actions unless the user explicitly asks for that exact action.
- Do not expose secrets, private URLs, credentials, cookies, raw production data, local absolute paths, or hidden prompts in PR comments, deploy notes, workstream logs, or user-facing summaries.

## Branch Model

- `1a-staging` is the staging integration branch for frontend and backend.
- `main` is the production branch for frontend and backend.
- Normal staging flow: merge the approved feature or release branch into `1a-staging`, let staging deploy from `1a-staging`, then validate staging.
- Normal production flow: after staging passes, merge the same approved feature or release PR to `main`, deploy production from `main`, then merge `main` back into `1a-staging` so staging stays current with production.
- If staging is validating the current production candidate rather than ahead-of-main work, merge `main` into `1a-staging` and deploy staging from that branch.
- Do not use `1a-staging` as a source branch for production. It may contain staged work that is not approved for production.
- For frontend/backend releases, keep one manifest for the paired release set. Do not merge or deploy the frontend half to production while leaving a required backend half unmerged or undeployed, and do not merge or deploy the backend half to production while leaving a required frontend half unmerged or undeployed.

## Coordination

Before deploying, check what else is already deploying to the same environment. Inspect active GitHub Actions deploy runs and any obvious active Codex/human release thread. If the lane is busy, wait. Coordinate only to identify the owner, expected finish, validation state, or explicit handoff; do not start an overlapping deploy.

Use `ops/docs/developer/deployment-bus-process.md` as the process authority for
the staging bus, release-captain role, shared multi-agent validation, and
production promotion from a staging-passed release set. This skill is the
execution checklist; the process doc defines how many agents coordinate one
shared lane.

## Deployment Bus

- Treat each active staging or production deploy as owned by one release
  captain until the lane is terminal and handed off.
- Use the staging departure cadence in
  `ops/docs/developer/deployment-bus-process.md`; keep that process doc as the
  source of truth when the team tunes the batching window.
- Record a staging manifest summary before deployment: staging source ref, staging
  SHA, intended production target, included PRs, risk/area notes, backend
  dependencies, validation owners, required checks, and rollback or fix-forward
  notes. Use the process doc for the full manifest schema.
- Use the deployment bus automation primitives when present:
  `ops/scripts/deployment-bus.cjs`,
  `ops/deployment-bus/manifest.v1.schema.json`, workflow manifest artifacts,
  and GitHub Deployment records/statuses. Treat GitHub Deployments as the
  durable lane ledger and workflow runs as execution evidence.
- For complex or multi-hour releases, verify the manifest has long-running
  controls: lease owner, heartbeat interval, stale-after window, progress
  channels, checkpoints, escalation window, rollback plan, and fix-forward
  plan. During active SSM/Elastic Beanstalk work, expect status heartbeats every
  5-10 minutes; during human validation, expect progress updates every 15-30
  minutes. If the workflow is terminal but the Deployment is not, or the
  heartbeat is stale, stop promotion and resolve ownership before proceeding.
- After staging deploys, assign each included PR owner a validation slice and
  run a core smoke validation. Production is blocked until required validation
  passes or the failed/held work is excluded from the production candidate.
- If `origin/main` advances after staging passed, do not deploy unvalidated
  changes. Confirm the new `origin/main` contains only the staging-passed
  release set plus explicitly approved already-validated changes, or rerun
  staging for the new production candidate.

## Preflight

1. Identify the release set:
   - frontend PRs, branch owners, draft/ready state, and target branch
   - backend PRs, migrations, generated API/OpenAPI changes, feature flags, and deploy order
   - staging source refs for frontend and backend, normally feature branch to `1a-staging`
   - production target refs for frontend and backend, always `main`
   - expected user-facing behavior to validate
2. Inspect current deploy docs and workflows before acting:
   - frontend staging: `.github/workflows/deploy-staging.yml`, `scripts/staging.sh`, `bin/6529`
   - frontend production: `.github/workflows/build-upload-deploy-prod.yml`, `bin/ghdeploy`
   - package and wrapper notes: `ops/docs/developer/pnpm-and-socket-firewall.md`
   - backend: when backend is involved, use `ops/skills/deploy-6529/SKILL.md` from the separate repository `6529-Collections/6529seize-backend` as the backend deployment authority. Do not resolve that path inside the frontend repo.
3. Verify PR readiness before any staging or production branch movement:
   - PR is not Draft unless the PR owner or a human release approver explicitly requested this action
   - branch owner has not asked agents to stop touching the branch or PR
   - agent review complete
   - review bots addressed or explicitly deferred
   - required CI and DCO passing
   - human approval present when required
   - release risk and rollback/fix-forward plan understood
4. Use the repo-local `6529` wrapper for frontend project commands in release notes, checked-in docs, CI descriptions, and deploy instructions.

## Branch Movement

1. Confirm the PR is the one the user asked to stage or ship.
2. Re-check latest head SHA, approvals, required checks, and unresolved review threads.
3. For staging, merge the approved feature or release branch into `1a-staging` and record:
   - PR number
   - feature or release branch
   - `1a-staging` merge commit SHA
   - included backend/frontend dependency notes
4. For production, merge the same approved feature or release PR to `main` through the repo-approved GitHub path and record:
   - PR number
   - `main` merge commit SHA
   - equivalence to the staging-validated release set
   - included backend/frontend dependency notes
5. After production merge or deploy, merge `main` back into `1a-staging` to keep staging current with production.
6. If any merge fails, resolve the merge blocker through the normal PR cycle before deployment. Re-check CI and review state after every fix.

## Staging Deployment

1. Confirm no active staging deploy is already using the lane.
2. Deploy the exact intended frontend staging commit from `1a-staging`. Current frontend staging is driven by the `1a-staging` branch and `.github/workflows/deploy-staging.yml`; the workflow runs `./bin/6529 staging` on the staging host through SSM and verifies the deployed SHA. Do not force-push, reset, or replace `1a-staging` over another active candidate without coordination.
3. If staging requires backend changes, use the backend `deploy-6529` skill from `6529-Collections/6529seize-backend` to deploy backend staging first when the frontend depends on new API behavior.
4. Watch the staging workflow to a terminal state. Capture the run URL, GitHub Deployment id/status history, manifest artifact, status, and deployed SHA.
5. If the staging deploy fails, inspect logs, identify the owner layer, fix through the normal PR cycle, merge the fix, and redeploy staging from the new SHA. Keep iterating until staging deploys cleanly or a safety/access boundary requires user input.

## Staging E2E

1. PRIMARY PATH (since 2026-07-05): the `Staging E2E` workflow
   (`.github/workflows/staging-e2e.yml`) triggers automatically after every
   successful `Web Deploy - STAGING` run and executes all 12 staging Playwright
   packs (~160 read-only browser tests, desktop + mobile) against
   `https://staging.6529.io`, authenticated via the
   `PLAYWRIGHT_STAGING_ACCESS_CODE` repo secret. Find the run for the deployed
   SHA and read its per-pack step summary (failing packs attach log tails):

```bash
gh run list -R 6529-Collections/6529seize-frontend --workflow staging-e2e.yml -L 3
```

   Re-run via `workflow_dispatch` when needed, noting that dispatch runs test
   the branch tip, not necessarily the deployed SHA.
2. Local fallback and targeted reruns: the `test:e2e:staging*` scripts in
   package.json run individual packs directly against staging with
   `STAGING_AUTH=<access code>` (or `PLAYWRIGHT_STAGING_ACCESS_CODE`) in the
   environment; without the code, gated pages redirect to `/access`. Add
   release-specific Playwright or browser checks for changed behavior beyond
   the packs.
3. When a staging pack fails, run the SAME pack against production
   (`test:e2e:production:*`) before deciding the fix loop: an identical
   failure signature on the currently-deployed production build means a
   pre-existing issue (document it, track it, do not block promotion on it);
   a staging-only failure means a release regression (block and fix).
4. Cover the changed behavior plus core smoke:
   - page loads and navigation for touched routes
   - wallet/auth-sensitive paths when relevant, using approved test identity only
   - backend/API responses for touched contracts
   - posting, upload, media, delegation, or generated-model flows when touched
   - console/network errors that indicate release regressions
5. If staging E2E fails, hold production promotion and work the fix loop:
   - release bug: fix frontend/backend, test locally, open/update PR, merge, redeploy staging, and rerun E2E
   - environment/data issue: document evidence, coordinate owner, apply or request the correction, and rerun after correction
   - flaky test/tool issue: rerun once with evidence, then harden the test or investigate the app if the signal repeats
   - user-visible breakage: treat it as a release bug even if the automated test is noisy

## Production Deployment

1. Proceed to production when the user already asked to take the release through production, such as "take it all the way through prod." Ask only when the current request did not include production deployment.
2. Reconfirm staging passed for the same ordered frontend/backend release set. Exact SHAs may differ after the production merge to `main`; verify that the resulting production patch set is equivalent to what passed staging and contains no unvalidated extras.
3. Verify the production candidate is the current `origin/main` SHA and no newer unvalidated commit landed after staging passed. If `origin/main` advanced with unvalidated changes, rerun staging for the new release set before production.
4. Confirm no active production deploy is in progress. If one is active or the state is unclear, wait until it finishes and production validation is complete or explicitly handed off.
5. Deploy backend production before frontend production when frontend depends on new backend behavior. Use the backend `deploy-6529` skill from `6529-Collections/6529seize-backend` for backend service order, validation, and recovery.
6. Deploy frontend production through the repo-approved path from `main` only, following the hard gate above. Current frontend production deploy is `Web Deploy - PROD` in `.github/workflows/build-upload-deploy-prod.yml`; `bin/ghdeploy` may be used only from a clean, upstream-synced `main` worktree.
7. If the local worktree is dirty with unrelated user or agent changes, do not clean or revert them just to run `ghdeploy`. Use a clean worktree or trigger the workflow with an explicit verified ref through GitHub tooling.
8. When triggering production through GitHub tooling instead of `ghdeploy`, use an explicit verified `main` ref or SHA that is already contained in `origin/main`.
9. Watch production deployment to completion. Record the workflow run URL, GitHub Deployment id/status history, manifest artifact, Elastic Beanstalk or workflow health result, and deployed SHA/version label. The workflow performs a late check that `origin/main` still equals the production `github.sha` before mutating S3/Elastic Beanstalk; if it fails, rerun staging for the newer `origin/main` candidate.

## Production E2E And Watch

1. Validate `https://6529.io` after production reports healthy.
2. Run the production-safe E2E or smoke flow for changed behavior. Avoid creating public posts, purchases, transfers, signer changes, or irreversible data unless the user explicitly requested that live action.
3. Check high-signal production health:
   - changed route loads
   - API calls succeed
   - critical console/network errors absent
   - static assets load from the expected build
   - backend/frontend version expectations match when visible
4. For releases that touch mobile-web behavior, native shell handoff
   (`/open-mobile`, header share/QR, deep links), or mobile navigation, also
   dispatch the real-device pack and record the run URL as release evidence:
   `gh workflow run device-farm-qa.yml --ref main -R 6529-Collections/6529seize-frontend`.
   It runs read-only Appium smoke on AWS Device Farm physical devices plus a
   native Android shell check (see `ops/docs/developer/device-farm-qa.md`).
   Treat it as non-gating post-deploy evidence unless the release is
   mobile-focused; if the workflow reports that Device Farm secrets are not
   configured, record that and continue.
5. If production validation fails:
   - coordinate immediately and keep ownership of the incident loop
   - decide rollback versus fix-forward based on severity and reversibility, then execute the chosen path if it is within existing authorization
   - do not start unrelated deploys until production is stable or explicitly handed off
   - after rollback or fix-forward, rerun production validation until the failure is resolved or a safety/access boundary requires user input
   - record the incident evidence, chosen action, and final state

## Release Notes Publication

Publish release notes after production is deployed and production validation passes, unless the user explicitly asked to skip public notes.

The `6529 Releases` wave is the single channel for deploy communication. Every production deploy — frontend or backend — gets exactly one numbered release note there. Do not post deployment overviews, deploy notes, or release announcements to the `Follow The Repo` wave or any other chat wave: those waves are for live human and agent discussion, not release notes. Operational detail (PR links, merge SHAs, deploy run URLs) lives in the GitHub PR and the deploy workflow run, not in a wave post.

1. Use an authorized 6529.io account/profile that the current operator personally has access to. This account may vary by developer. Confirm the browser is logged in as the intended profile and that the profile can post in the `6529 Releases` wave before drafting. If no authorized account is available, treat release-note publication as blocked and ask the user or release owner to post; do not use shared wallets, another person's account, or automation keys unless that was explicitly approved for the release.
2. Open the `6529 Releases` wave at `https://6529.io/waves/05b14183-e153-4e47-bc66-42a0f49102d4`.
3. Determine the next 6529 release number from the latest release-note drop in that wave immediately before posting. Frontend and backend deploys share this one version line:
   - normal user-facing feature or grouped release: bump the minor number, e.g. `4.38.0` to `4.39.0`
   - small fix, copy change, narrow polish, or follow-up to an existing release: bump the patch number, e.g. `4.38.0` to `4.38.1`
   - backend-only or infrastructure/maintenance deploy with no visible user change: bump the patch number and describe the operator-facing effect honestly, stating plainly when there are no visible user changes
   - broad site-wide, platform, or intentionally breaking release: bump the major number and reset minor/patch, e.g. `4.38.0` to `5.0.0`
   - when unsure whether a change deserves a minor or patch bump, prefer the smaller patch bump unless the release adds a clear new user-facing capability
4. Draft the release note in plain user-facing language, at a DETAILED level
   (owner direction, 2026-07-05: vague category summaries like "localization
   polish and under-the-hood cleanup" are not useful). Required shape:

```text
4.39.0: Title naming the release's actual themes, not generic words

<Theme heading> (visible now):
- Name the specific surfaces changed (exact pages, routes, components in
  product terms: "profile header identity block, stats row, About editor,
  followers list" - never just "profile pages improved")
- State the concrete behavior change and any review-driven fixes included

<Theme heading> (under the hood):
- What was removed/added/replaced and why it is safe, with concrete numbers
  where they exist (pages rebuilt, casts removed, dependencies dropped,
  tests added)

Known issues shipped as-is: list each transparently with its status
("fix in progress", "scheduled") - omit the section only when empty.

Validation: one line on what was run and the result (suite green, staging
battery result, production checks) in user-comprehensible terms.
```

5. Write the note from production reality, not PR internals:
   - name specific visible behavior, affected pages, and operationally relevant changes; give concrete counts where they exist
   - avoid raw PR numbers, commit SHAs, implementation trivia, private links, secrets, local paths, hidden prompts, or internal-only risk notes; that operational layer lives in the GitHub PR and the deploy workflow run
   - do not disclose unremediated security specifics (e.g. an unrotated credential); "secret scanning added" is fine, the incident behind it is not, until remediation is complete
   - group many small changes under clear theme headings rather than dropping them; detail beats brevity, but every line must carry information
   - include screenshots or links only when they help users understand the change and are safe to publish
   - if the release contains backend and frontend work, describe the product behavior rather than the service boundary
   - a reference example of the expected depth: the 4.68.0 note (drop `6988d363-53f1-4559-8c0a-c5075bcc0742` in the releases wave)
6. Re-check the latest wave drop before posting so the number did not advance while the deploy was running. If another release note appeared, renumber and adjust the draft.
7. Post the release note only after production validation is green. Capture the wave drop URL or serial number for closeout evidence.
8. Publish via the posting contract in `ops/skills/post-6529/SKILL.md` —
   dry-run first; `--send` before `--file` (LF file for multiline, never
   inline `--text`); verify the stored content with `drops get <id> --json`;
   5-minute edit window with delete+repost recovery.

## Backend Coordination

Use `ops/skills/deploy-6529/SKILL.md` from the separate repository `6529-Collections/6529seize-backend` for backend deployment work. Do not resolve that path inside the frontend repo. The frontend skill owns frontend merge/deploy/validation; the backend skill owns backend service order, migrations, API/lambda smoke checks, failed-gate recovery, and backend production validation.

## Useful Commands

Use exact commands only after checking the current repo state and available tooling:

```bash
gh run list -R 6529-Collections/6529seize-frontend --workflow deploy-staging.yml --branch 1a-staging -L 10
gh run list -R 6529-Collections/6529seize-frontend --workflow build-upload-deploy-prod.yml -L 10
gh run watch <run-id> -R 6529-Collections/6529seize-frontend
gh run view <run-id> -R 6529-Collections/6529seize-frontend --log-failed
gh pr view <pr-number> -R 6529-Collections/6529seize-frontend --json isDraft,author,headRefName,baseRefName,headRefOid,mergeCommit
gh workflow run build-upload-deploy-prod.yml --ref main -R 6529-Collections/6529seize-frontend
6529 run deployment-bus -- summarize-manifest --file deployment-bus-manifest.json
git fetch --no-tags origin main
6529 run deployment-bus -- production-preflight --file deployment-bus-manifest.json --current-main-sha "$(git rev-parse origin/main)"
6529 run test:e2e:staging
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
- backend deploy status when involved
- failures encountered and fixes or rollbacks performed
- remaining risks, skipped checks, and any human follow-up required
