# Staging And Production Deployment Bus

Status: process proposal for team review. This page defines the operating
model before automation. A later automation PR should add labels, queue
materialization, GitHub Deployment records, manifests, staging E2E commands,
and dashboard helpers.

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
- production only from the same `origin/main` SHA or release set that passed
  staging
- human-owned production approval

## Current Deployment Facts

Frontend staging:

- Staging uses the `1a-staging` branch.
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

Known current gaps:

- There is no durable staging bus ledger yet.
- There is no dedicated deployed-staging E2E command yet. Current Playwright
  E2E is local by default and starts a local dev server.
- GitHub Deployment objects are not yet the authoritative ledger for staging or
  production in this repo.
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

- merged to `origin/main`, unless staging is intentionally testing a PR before
  merge under a documented exception
- required CI and review bots terminal or explicitly deferred
- risk and area understood
- backend dependencies listed with required deploy order
- validation owner identified
- rollback or fix-forward path understood

Staging manifest:

```text
environment: staging
candidate_sha: <frontend main or staging branch SHA>
candidate_branch: 1a-staging
included_prs:
  - number:
    title:
    merge_sha:
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
status: queued | deploying | validating | passed | failed | held | superseded
```

Until automation exists, the release captain can keep this manifest in the PR
description, a deployment wave update, or a workstream note. The automation PR
should make it a durable artifact and GitHub Deployment payload.

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

- staging passed for the same ordered frontend/backend release set
- the production candidate is exactly the current `origin/main` SHA
- no newer unvalidated commit has landed on `origin/main` after staging passed
- no production deploy is already active
- backend production dependencies are deployed and validated first
- the human release approver accepted the manifest

If `origin/main` advances after staging passed, do not deploy production from
the older validated SHA. Either:

- rerun the staging bus for the new `origin/main` SHA, including the additional
  PRs in the manifest, or
- pause merging briefly before final staging validation and production
  promotion.

Production validation:

- verify the production deploy run and deployed SHA/version label
- run production-safe smoke checks for changed behavior
- avoid public posts, purchases, transfers, signer changes, destructive data
  work, or other irreversible actions unless the user explicitly requested
  that live action
- post public release notes and a Follow The Repo deployment overview only
  after production validation is green, following `ops/skills/deploy-6529`

## Cross-Repo Release Ordering

Use this order when a release spans frontend and backend:

1. Name the backend PR, SHA, services, deploy order, and owner in the manifest.
2. Confirm backend OpenAPI/generated files are current when API contracts
   changed.
3. Regenerate or verify the frontend client against the intended backend
   contract before using new API behavior.
4. Merge and deploy additive backend changes to staging.
5. Validate backend staging, including API or service smoke.
6. Deploy frontend staging for the candidate that uses the backend behavior.
7. Validate frontend staging and cross-repo behavior together.
8. Deploy backend production first when frontend production depends on new
   backend behavior.
9. Validate backend production.
10. Deploy frontend production from `origin/main`.
11. Validate frontend production and the user-visible integrated behavior.

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

The follow-up automation PR should implement the process above. Candidate work:

- `staging:queued`, `staging:deployed`, `staging:passed`, `staging:failed`,
  `release:candidate`, `release:hold`, and `release:blocked` labels
- risk and area classification policy
- staging queue collector
- manifest generation as an artifact
- GitHub Deployment and deployment status writes for staging and production
- PR comments that record inclusion, deployed SHA, validation owner, and result
- deployed-staging Playwright support without starting a local web server
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
