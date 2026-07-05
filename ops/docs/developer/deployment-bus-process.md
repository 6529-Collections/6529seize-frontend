# Staging And Production Deployment Bus

Status: process authority. This page defines the operating model that
deployment-bus automation must follow. Automation should be added in reviewable
slices: durable manifests and GitHub Deployment records first, then queue
materialization, labels, PR comments, dashboard helpers, and stricter
production preflight gates.

Implementation note: the automation slices are documented in
`ops/docs/developer/deployment-bus-automation.md`. They add manifest
validation, GitHub Deployment ledger records, workflow artifacts, standard
deployed-environment validation pack names, release report artifacts,
deployed-staging smoke support, auto-hold evaluation for missing release
evidence, post-deploy watch checkpoints, canary-readiness declarations, and
long-running deployment heartbeats without automating queue movement or
production promotion.

## Why This Exists

The frontend and backend deployment lanes are shared, slow enough to become a
team bottleneck, and increasingly used by many agents at once. Without a
single process, agents can validate different assumptions, overwrite staging,
or ask production to ship a commit that did not pass staging.

The deployment bus turns staging and production into an explicit queue:

- one owner per active deployment lane
- exact SHAs and included PRs recorded before deploy
- no overlapping deploys to the same environment
- shared validation assignments for all included PR owners
- staging normally validates feature or release branches on `1a-staging`
  before those branches merge to `main`
- production only from `origin/main` after the same release set or equivalent
  resulting patch set passed staging
- no promotion path ever merges `1a-staging` into `main`
- human-owned production approval

## Current Deployment Facts

Frontend staging:

- Staging uses the `1a-staging` branch as the integration branch.
- `.github/workflows/deploy-staging.yml` runs on pushes to `1a-staging` and
  manual dispatch.
- The workflow uses `concurrency.group: staging-deploy` with
  `cancel-in-progress: false`.
- The workflow resolves the expected SHA, sends an SSM command to the staging
  host, fetches `origin/1a-staging`, refuses to deploy if the fetched SHA is
  not the expected SHA, runs `./bin/6529 staging`, and verifies the deployed
  checkout still matches the expected SHA.
- `scripts/staging.sh` installs dependencies, builds, restarts the PM2
  `6529seize` process, and saves PM2 state.
- Normal staging branch movement is feature or release branch to `1a-staging`.
  This intentionally lets staging test work before it is on production
  `main`.
- When `main` changes, merge `main` back into `1a-staging` so staging stays at
  least as current as production. Do not merge `1a-staging` into `main`.

Frontend production:

- `.github/workflows/build-upload-deploy-prod.yml` is manually dispatched.
- The workflow uses `concurrency.group: web-deploy-prod` with
  `cancel-in-progress: false`.
- The `assert-main-ref` job rejects any selected ref other than
  `refs/heads/main`.
- Production builds in CI, uploads static assets and a Next standalone bundle,
  creates an Elastic Beanstalk application version labeled with the GitHub SHA,
  updates the production environment, waits for health, and verifies the EB
  version label equals the workflow SHA.
- `bin/ghdeploy` may be used only from a clean repo root on `main`, exactly in
  sync with its upstream.

Backend coordination:

- Backend deploys use `6529seize-backend` and its own `deploy-6529` skill.
- Backend staging also uses the `1a-staging` branch. Backend production also
  uses `main`.
- Backend `.github/workflows/deploy.yml` dispatches one service at a time for
  `environment=staging` or `environment=prod`.
- Backend releases must identify services and order before deploy.
  `dbMigrationsLoop` goes before services that depend on entity sync, schema
  behavior, explicit migrations, or backfills. `api` goes before frontend
  production when the frontend depends on new API behavior.
- Backward-compatible backend/API changes are preferred so frontend and backend
  can roll independently.
- Backend OpenAPI changes must show that backend generated files are current
  and that the frontend generated client matches the intended backend contract
  before frontend staging uses new API behavior.

Known current gaps after the first automation slice:

- There is no automated queue collector, release label state machine, or release
  captain dashboard yet.
- The durable manifest artifact is authoritative for this slice; GitHub
  Deployment records are the status/history pointer, not the full manifest
  datastore.
- Current rollout capability:
  - auto-hold: supported by release-readiness evaluation;
  - staged watch: supported through workflow checkpoints, Deployment statuses,
    release-report fields, and release-captain validation updates;
  - feature flags: app-specific only, not a generic release-lane capability;
  - traffic-split canary rollout: not currently supported by the deployment bus;
  - durable artifact storage: deployment HTTP version evidence attempts an
    approved private S3 upload when deploy verification passes; upload failure
    warns but does not block the already-verified deployment, and no durable
    artifact pointer is recorded unless the upload succeeds. Full
    required-pack artifact capture still needs validation-pack automation.
- Release reports evaluate whether required packs and durable artifact pointers
  are recorded, but the workflows still do not automatically run those
  post-deploy Playwright packs. The release captain or validation agents must
  run them and record results with `record-validation-check` until a later
  automation slice wires pack execution into the lane.
- The workflows record post-deploy deploy-verification checkpoints and run a
  GET-only `/api/version` check against the deployed HTTP app. The redacted
  version-evidence JSON is uploaded to approved S3 storage as
  `deployment:http-version` evidence when the artifact IAM/storage path is
  available. If that upload fails, the workflow emits a warning and leaves
  release readiness incomplete instead of recording a fake durable pointer.
  GitHub Actions run URLs and temporary artifacts remain useful context, but
  only approved durable pointers satisfy durable artifact requirements.
- The current standard pack plan requires desktop Chromium and mobile Chromium
  evidence for `playwright:core-smoke`, `playwright:surface-matrix`, and
  `playwright:wcag-i18n`. The deployment bus also knows the optional
  production-only `playwright:production-readonly` aggregate, which records
  desktop Chromium production evidence when a release captain explicitly opts
  into it, plus optional `native:surface-evidence`, which records the native
  evidence classifier output without running simulator specs. Firefox, WebKit,
  Capacitor simulation, and Electron simulation remain optional train/nightly or
  targeted validation lanes and must not be described as real native or real
  Electron shell coverage. Package-prerequisite evidence also is not enough for
  real native or packaged Electron claims; those claims require separate
  package-build and runtime-smoke artifacts.
- Backend coordination is still a cross-repo handoff, not a shared automated
  release train.

## Operating Roles

Release captain:

- owns one active environment lane until it is terminal and handed off
- assembles the staging or production manifest
- checks active deploy runs before moving the lane
- assigns validation owners and keeps the status ledger current
- decides whether a failure blocks the whole batch, needs fix-forward, or
  needs human escalation
- posts concise deployment-topic updates to the team wave when useful

PR owner or validation agent:

- validates the changed surface for a PR included in the batch
- reports exact evidence: route, API, command, browser check, screenshot, run
  URL, or failure
- does not move staging, trigger production, or overwrite the active candidate
  unless the release captain hands off the lane

Core smoke validator:

- validates common app health for the deployed candidate
- checks route load, critical API responses, console/network failures, and
  obvious static asset/version issues

Human release approver:

- approves production promotion from a staging-passed manifest
- decides whether to include, hold, or override high-risk changes
- owns decisions that are destructive, irreversible, or not represented by
  automated checks

## Staging Bus Policy

Staging is the integration surface. It should move quickly when idle and batch
when the team is generating more work than the lane can deploy.

Departure policy:

- If the staging lane is idle and exactly one eligible release set is ready,
  depart immediately. Do not wait for the clock.
- If the lane is busy or there is a backlog, use bus mode. Close the next
  batch at a fixed cutoff and depart as soon as the previous staging cycle is
  terminal.
- Use 30 minutes as the initial maximum batching window under backlog. Tune it
  from measured deploy duration, validation duration, queue length, and failure
  rate.
- Emergency fixes can bypass the normal batch window with an explicit human or
  release-captain decision, but they still must obey the no-overlap and SHA
  evidence gates.

Eligible release set:

- approved for staging by the PR owner, release captain, or human release
  approver
- not Draft, unless the PR owner or a human release approver explicitly named
  the PR and requested staging
- feature or release source branches are known and branch owners have not asked
  agents to stop touching them
- required CI and review bots terminal or explicitly deferred
- risk and area understood
- backend dependencies listed with required deploy order
- validation owner identified
- rollback or fix-forward path understood

Staging manifest:

```text
environment: staging
staging_branch: 1a-staging
staging_source_ref: <feature branch, release branch, or main sync source>
staging_deploy_sha: <actual SHA deployed from 1a-staging>
production_target_branch: main
production_candidate_sha: <origin/main SHA after production merge, when known>
validated_release_set: <named PRs/branches intended to ship together>
release_equivalence: <same SHA | same patch set | requires rerun>
included_prs:
  - number:
    title:
    source_ref:
    target_branch:
    draft_status:
    owner_clearance:
    staging_merge_sha:
    production_merge_sha:
    risk:
    areas:
    validation_owner:
    required_checks:
backend_dependencies:
  - repo:
    pr:
    sha:
    service:
    staging_sha:
    prod_sha:
    order:
    openapi_or_generated_client:
validation:
  core_smoke_owner:
  required_packs:
  exploratory_checks:
post_deploy_watch:
  required:
  status:
  checkpoints:
canary_readiness:
  current_capability:
  traffic_splitting_supported:
status: queued | deploying | validating | passed | failed | held | superseded
```

Until automation exists, the release captain can keep this manifest in the PR
description, a deployment wave update, or a workstream note. The automation PR
should make it a durable artifact linked from GitHub Deployment status history.

For production gating, `validated_release_set` and `release_equivalence` are
the important fields. A staging deployment that contains a feature branch before
it is on `main` can satisfy production only for that same named release set
after the feature PR merges to `main` and no unrelated unvalidated changes are
included. Exact SHAs may differ between `1a-staging` and `main`; the release
captain must verify the resulting patch set, included PRs, and backend ordering
match what passed staging. If `main` includes additional unvalidated work, rerun
staging for the new production candidate or hold production.

## Multi-Agent Staging Validation

After staging deploys:

1. The release captain posts the deployed SHA, included PRs, owners, and
   validation checklist.
2. Each PR owner validates only their owned surface and reports evidence.
3. The core smoke validator checks common app health.
4. The release captain marks every included PR as passed, failed, held, or
   superseded.
5. Production remains blocked until every required validation item is passed or
   explicitly held out of the production candidate.

Failure handling:

- If a release bug is found, fix forward through the normal PR path, merge the
  fix, redeploy staging from the new SHA, and rerun the failed and smoke checks.
- If the failure belongs to environment or data state, document the evidence,
  coordinate the owner, rerun after correction, and keep production blocked
  until the signal is clear.
- If a check is flaky, rerun once with evidence. Repeated failures become a
  release bug or test-hardening task.
- If a single PR in a batch is held, production can proceed only if the held
  behavior is not present in the production candidate. With the current
  production-from-main gate, that usually means waiting for a fix-forward or
  intentionally validating the newer `origin/main` SHA after the hold is
  resolved.

## Production Promotion Policy

Production deploys from `origin/main` only in the current frontend workflow.
That hard gate is intentional for this process proposal.

Before production:

- staging passed for the same ordered frontend/backend release set or the same
  resulting patch set after merge to `main`
- the production candidate is the current `origin/main` SHA
- no newer unvalidated commit has landed on `origin/main` after staging passed
- no production deploy is already active
- backend production dependencies are deployed and validated first
- the human release approver accepted the manifest

If `origin/main` advances after staging passed, do not deploy unvalidated work.
Either:

- prove the new head contains only the staging-passed release set plus
  explicitly approved already-validated work, or
- rerun the staging bus for the new `origin/main` SHA, including any additional
  PRs in the manifest, or
- pause merging briefly before final staging validation and production
  promotion.

Promotion path:

1. Merge the approved feature or release PRs to `main`.
2. Deploy production from `main`.
3. Merge `main` back into `1a-staging`.

Never merge `1a-staging` into `main`. `1a-staging` may contain work that is
valid for staging but not approved for production.

Production validation:

- verify the production deploy run and deployed SHA/version label
- run production-safe smoke checks for changed behavior
- record post-deploy watch checkpoints and final watch status in the deployment
  bus manifest before release notes
- avoid public posts, purchases, transfers, signer changes, destructive data
  work, or other irreversible actions unless the user explicitly requested
  that live action
- post the public numbered release note only after production validation is
  green, following `ops/skills/deploy-6529`; all deploy communication goes to
  the `6529 Releases` wave as one numbered note, never to `Follow The Repo` or
  any other chat wave

## Cross-Repo Release Ordering

Use this order when a release spans frontend and backend:

1. Name the backend PR, SHA, services, deploy order, and owner in the manifest.
2. Confirm backend OpenAPI/generated files are current when API contracts
   changed.
3. Regenerate or verify the frontend client against the intended backend
   contract before using new API behavior.
4. Merge the backend feature or release branch to backend `1a-staging`, then
   deploy the required backend staging services from `1a-staging`.
5. Validate backend staging, including API or service smoke.
6. Merge the frontend feature or release branch to frontend `1a-staging`, then
   deploy frontend staging for the candidate that uses the backend behavior.
7. Validate frontend staging and cross-repo behavior together.
8. When the release set is ready, merge the same backend and frontend PRs to
   `main` in their repos.
9. Deploy backend production first when frontend production depends on new
   backend behavior.
10. Validate backend production.
11. Deploy frontend production from `origin/main`.
12. Validate frontend production and the user-visible integrated behavior.
13. Merge `main` back into `1a-staging` in both repos so staging tracks
    production plus any intentionally staged ahead-of-main work.

Prefer compatibility windows:

- Backend accepts old and new frontend clients.
- Frontend feature flags or guards hide behavior until backend production is
  ready.
- OpenAPI/generated model changes are staged so either side can roll forward
  safely.

## Hotfix Path

Hotfixes use the same lane with a smaller manifest.

- Declare the hotfix reason and impacted risk area.
- Check whether staging or production is active.
- Prefer staging first. A production override needs explicit human approval and
  a rollback or fix-forward plan.
- Keep the production candidate on `origin/main`.
- After the hotfix, resume the bus and mark superseded staging candidates.

## Automation PR Scope

The first automation PR implements the durable manifest, GitHub Deployment
status records, deployed-staging Playwright support, and production same-SHA
preflight. Remaining candidate work:

- `staging:queued`, `staging:deployed`, `staging:passed`, `staging:failed`,
  `release:candidate`, `release:hold`, and `release:blocked` labels
- risk and area classification policy
- staging queue collector
- PR comments that record inclusion, deployed SHA, validation owner, and result
- a service-by-service backend smoke matrix or handoff template, likely in the
  backend repo first
- release captain dashboard or CLI for active lane, queue, and production lag
- production preflight that detects when `origin/main` advanced after staging
  validation
- optional GitHub Actions concurrency queue settings once verified in this repo

Keep automation out of this PR so the team can review the process before the
repo starts enforcing it.

## External Guidance Reviewed

- [AWS Well-Architected Operational Excellence: frequent, small, reversible changes](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_freq_sm_rev_chg.html)
- [AWS Elastic Beanstalk deployment policies](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.rolling-version-deploy.html)
- [GitHub Actions environments and deployment records](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [GitHub REST deployments](https://docs.github.com/en/rest/deployments/deployments?apiVersion=2022-11-28)
- [GitHub Actions concurrency](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Google SRE Workbook: canarying releases](https://sre.google/workbook/canarying-releases/)
- [Microsoft Azure Well-Architected: safe deployments](https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/safe-deployments)
