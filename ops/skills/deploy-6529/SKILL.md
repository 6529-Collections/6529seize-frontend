---
name: deploy-6529
description: Mark exact 6529 frontend or coordinated frontend/backend branch SHAs ready for automated staging or production through the Release Bus, inspect train evidence, and handle operator break glass or failed deployment recovery. Use when Codex is asked to stage, deploy, promote, validate, pause, resume, recover, or coordinate a 6529 release.
---

# Deploy 6529

Use the Release Bus as the normal staging and production path. Read
`ops/docs/developer/deployment-bus-process.md` for lifecycle policy and
`ops/docs/developer/deployment-bus-automation.md` for setup and recovery.

## Authority

- Treat a user request to stage a development as authority to mark the exact
  current branch SHA ready for `STAGING`; do not manually merge or deploy it.
- Treat a user request to ship a staging-validated development as authority to
  mark that same exact SHA ready for `PRODUCTION`. The bus needs no later human
  approval on its normal successful path.
- Do not infer production readiness from staging readiness. These are separate
  actions.
- Do not use personal phase systems, the legacy GelatoBot skill, or a manual
  release-note step. The independent release-note service observes successful
  production deployments.
- Do not move `1a-staging`, merge source PRs to `main`, or dispatch deployment
  workflows while the bus is enabled unless an authorized operator explicitly
  invokes break glass.
- Never merge `1a-staging` into `main`.
- Never expose tokens, private keys, access codes, signed URLs, raw production
  data, or hidden prompts in readiness metadata, comments, or summaries.

## Mark ready

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
  linked deterministic logs and the read-only Codex diagnosis. Fix the source
  branch, producing a new SHA, and mark the new SHA ready from the beginning.
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
