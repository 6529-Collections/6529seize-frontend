---
name: deploy-6529
description: During the temporary Release Bus v2 maintenance window, require authenticated live mode OFF plus disabled enforcement and use only the serialized manual route for exact frontend or coordinated frontend/backend SHAs. Retained v1 shadow, bus, and break-glass routes are rollback reference only. Use when Codex is asked to stage, deploy, promote, merge for release, validate, pause, resume, recover, or coordinate a 6529 release.
---

# Deploy 6529

## Temporary v2 maintenance override

Until the v2 production cutover and rollback observation criteria tracked by
branch `agent/simple-release-bus-v2-plan` at commit
`0d8fb5e726279b4a80592b3dc7d4ec3db75065e9` are complete and this section is
deliberately removed:

1. Do not submit readiness to Release Bus v1.
2. Run `./bin/6529 exec node ops/scripts/release-bus-status.mjs` before any
   staging or production mutation and continue only when it reports `mode:
   OFF`. If it is not `OFF`, wait and retry; do not use break glass to bypass
   the transition.
3. Require `RELEASE_BUS_ENFORCEMENT` to be absent or exactly `false` in every
   repository in the release set. Stop on `true`, any other value, or lookup
   failure. Steps 2 and 3 are one fail-closed AND gate: both must pass, and any
   disagreement stops the release.
4. Fetch the exact remote target head and inspect active frontend and backend
   staging/production workflows. Wait for every other actor; never cancel their
   workflow or force-push a shared branch. Re-fetch immediately before pushing
   and recompute the merge if the target moved.
5. Deploy required backend units before dependent frontend work. Dispatch only
   independent backend DAG units concurrently, and only when their workflows
   use `cancel-in-progress: false`.
6. Record exact deployed frontend/backend SHAs before E2E and freeze staging
   until that E2E run is terminal.
7. Require explicit owner authorization and successful exact staging validation
   for production. Do not publish a release note manually.

When the helper reports `OFF`, use the legacy manual route described below.
The older pause and mode-routing text remains rollback documentation, but it
does not authorize v1 readiness during this maintenance window.

Determine the live Release Bus mode before choosing either the bus or a manual
path. Read
`ops/docs/developer/deployment-bus-process.md` for lifecycle policy and
`ops/docs/developer/deployment-bus-automation.md` for setup and recovery.

## Mandatory live preflight

Run this read-only helper from the repository root:

```bash
./bin/6529 exec node ops/scripts/release-bus-status.mjs
```

Run it when a staging, production, promotion, merge-for-release, or deployment
request arrives; immediately before readiness submission; immediately before a
manual merge or workflow dispatch; and again before production after any
significant wait. Rerun whenever another actor could have changed rollout mode
or pause state.

The helper obtains the current developer token internally from authenticated
`gh`, queries the API, and prints only validated mode and pause states. Never
replace it with documentation, conversation history, an earlier check, GitHub
workflow configuration, AWS assumptions, repository files, or a signed-in
browser session. Never fall back to AWS CLI for mode discovery.

Fail closed. If `gh` is missing, require installation. If `gh` is
unauthenticated, require `gh auth login`. If the API is unavailable,
unauthorized, malformed, or returns an unknown state, stop before readiness,
merge, or deployment mutation and wait for the status check to succeed. Never
interpret uncertainty as `OFF` or as an enabled bus.

If `ALL` or the target lane is `PAUSED`, stop and report the paused scope. Do
not submit readiness or start a manual deployment unless an authorized
operator deliberately follows the audited break-glass procedure.

## Mode routing

> **Suspended during v2 maintenance:** only the `OFF` row is authorized. The
> other rows are v1 rollback reference and must not be actioned until the
> temporary override is deliberately removed.

| Live mode    | Staging behavior                                                 | Production behavior                                                         |
| ------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `OFF`        | Use the legacy manual path; do not queue in the bus              | Use the legacy manual path                                                  |
| `SHADOW`     | Record the candidate for shadow evaluation, then deploy manually | Record shadow evidence as designed, then deploy manually                    |
| `STAGING`    | Submit through the Release Bus and wait for validation           | Follow the operator/manual production path; do not queue a production train |
| `PRODUCTION` | Submit through the Release Bus                                   | Submit the staging-validated SHA through the Release Bus                    |

After an active bus lane accepts a candidate, never launch a parallel manual
deployment because the lane appears slow.

## Manual-route enforcement gate

> **Maintenance authority:** this gate is AND-combined with a fresh `mode:
> OFF` helper result. Legacy enforcement or break-glass text below cannot
> authorize a non-`OFF` mutation during v2 maintenance.

For every repository affected by a manual route, inspect its live Actions
variable with authenticated `gh`:

```bash
gh variable list --repo 6529-Collections/6529seize-frontend --json name,value
gh variable list --repo 6529-Collections/6529seize-backend --json name,value
```

Use only the repositories in the release set. A successful listing with no
`RELEASE_BUS_ENFORCEMENT` entry means disabled; exact `false` also means
disabled, and exact `true` means enabled. Stop on command failure or any other
non-empty value. `OFF` or `SHADOW` with enforcement enabled is a configuration
mismatch: alert an operator and do not deploy. If the selected manual route is
enforced, verify that the authenticated user is an organization owner or an
active `release-bus-operators` member, require a non-empty audited reason, and
use the documented break-glass input. Never bypass a blocked workflow.

## Authority

- Treat a user request to stage a development as authority to execute the live
  mode's staging route for the exact current SHA.
- Treat a user request to ship a staging-validated development as authority to
  execute the live mode's production route for that same exact SHA. An active
  bus needs no later human approval on its normal successful path.
- Do not infer production readiness from staging readiness. These are separate
  actions.
- Do not use personal phase systems, the legacy GelatoBot skill, or a manual
  release-note step. The independent release-note service observes successful
  production deployments.
- Do not move `1a-staging`, merge source PRs to `main`, or dispatch deployment
  workflows when the selected route belongs to an active bus lane unless an
  authorized operator explicitly invokes break glass.
- Never merge `1a-staging` into `main`.
- Never expose tokens, private keys, access codes, signed URLs, raw production
  data, or hidden prompts in readiness metadata, comments, or summaries.

## Bus readiness path

1. Open `/deploy/ui/bus` and authenticate with the developer's GitHub token.
2. Select `frontend`, enter the development branch, and resolve its current
   head. Confirm the displayed SHA is the intended immutable candidate.
3. Declare every required candidate dependency as `repository:branch`.
4. For staging, submit `STAGING` readiness and report the candidate ID, SHA,
   current status, and any dependency hold.
5. Wait for `STAGING_VALIDATED` before offering or submitting production
   readiness.
6. For production, resolve the branch again. Submit only if its head still
   equals the staging-validated SHA. If it moved, stage the new SHA first.
7. After submission, monitor the train and operation evidence. Do not dispatch
   a parallel deploy because the lane appears slow.

For coordinated frontend/backend work, declare the backend candidate as a
frontend dependency. Backend-first compatibility is mandatory; the bus rejects
a backend candidate that depends on frontend-first deployment.

## What to verify

Before staging readiness:

- the branch contains the intended development and has a clear owner;
- local/PR checks appropriate to the change have passed;
- required backend/API behavior is backward compatible or represented by a
  dependency;
- production-safe validation exists for changed behavior;
- rollback or fix-forward consequences are understood.

The bus then owns exact-SHA composition, backend-first staging deployment,
frontend staging deployment, staging E2E, evidence, and guarded
`1a-staging` advancement.

Before production readiness:

- the exact candidate has `STAGING_VALIDATED` evidence;
- the branch has not moved;
- all required cross-repository dependencies are production-ready or already
  production-validated;
- no unresolved release bug is being hidden by a flaky signal.

The production train restages the exact combined set, deploys backend first,
then merges/deploys frontend, runs production-safe read-only validation, and
syncs `main` back into staging.

## Failure handling

- If composition or preflight isolation proves this candidate fails, read the
  linked deterministic logs and, when enabled, the read-only Codex diagnosis.
  Fix the source branch, producing a new SHA, and mark the new SHA ready from
  the beginning.
- If Codex is disabled, a merge-conflicting candidate is quarantined and the
  rest of the train is requeued automatically. Use the PR comment and release
  branch to resolve the conflict; an OpenAI credential is not required for the
  remaining candidates to continue.
- Do not ask Codex diagnostics to eject another candidate. Deterministic checks
  own quarantine decisions.
- If the train is cancelled because `main` or `1a-staging` moved, leave the
  candidate queued; the next train rebuilds from the fresh base.
- If a production train fails after mutation begins, do not start unrelated
  deployments. The lane stays paused until a known-good rollback or fix-forward
  is validated and an operator resumes it.
- Never invent an automatic rollback for a service that lacks a committed
  rollback adapter.

## Operator controls and break glass

> **Suspended during v2 maintenance:** the break-glass route below is v1
> rollback reference only and cannot bypass the temporary `OFF` protocol.

Only members of `release-bus-operators` or organization owners may pause,
resume, or use break glass.

1. Open `/deploy/ui/bus`.
2. Pause `ALL`, `STAGING`, or `PRODUCTION` with an audited reason.
3. Wait for an already mutating AWS operation to become terminal.
4. Use `/deploy/ui` or the legacy workflow with an explicit break-glass reason.
5. Validate the exact deployed SHA and environment health.
6. Reconcile or fix the queued candidate state, then resume explicitly.

Break glass automatically pauses the affected scope and is rejected while a
release train remains active. Do not bypass this with a direct workflow
dispatch or branch push.

## Validation

Use the train's required workflow evidence first. For targeted investigation,
the existing read-only commands remain valid:

```bash
6529 run test:e2e:staging
PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:production:readonly
6529 run verify:deployment-version -- --base-url https://6529.io --expected-version <sha> --output deployment-version-evidence.json
```

Do not perform public writes, purchases, transfers, signer changes, or other
irreversible production actions unless the user explicitly authorized that
exact live action.

## Closeout

Report:

- immutable frontend/backend candidate SHAs and dependencies;
- staging and production candidate/train status;
- workflow and deployed-version evidence;
- quarantines, holds, pause state, or break-glass action;
- whether normal automation is complete or an operator action remains.

Do not manually publish a release note.
