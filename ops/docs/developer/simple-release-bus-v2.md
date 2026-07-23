# Simple Release Bus v2

Simple Release Bus v2 is the deployment authority for exact frontend/backend
candidate SHAs when its live mode enables a lane. Release Bus v1 stays disabled
as rollback reference.

## Route every request from live state

Run:

```bash
./bin/6529 exec node ops/scripts/release-bus-status.mjs
```

The helper prefers `/deploy/release-bus-v2/controls` and temporarily falls back
to the v1 endpoint only before the additive v2 API exists.

| Mode | Staging | Production |
| --- | --- | --- |
| `OFF` | Serialized legacy manual route | Serialized manual route with explicit owner authority and exact staging evidence |
| `STAGING` | V2 readiness | Production remains manual/disabled |
| `PRODUCTION` | V2 readiness | Separate explicit v2 action for an exact `STAGING_VALIDATED` candidate |

For an active mode, `ALL` and the target lane must be running. In `OFF`, paused
v2 controls are expected and the manual fallback remains available when
`RELEASE_BUS_ENFORCEMENT` is absent or `false`.

## Candidate contract

Register through `/deploy/ui/bus` or
`POST /deploy/release-bus-v2/candidates` with:

- repository, open PR number, branch, and exact head SHA;
- backend allowlisted deploy units and dependency DAG edges;
- candidate dependencies and their staging/production scope.

Registration verifies the branch, exact PR merge tree, and green check evidence.
An exact available PR artifact is accepted only from the same green workflow run
and digest. A new head supersedes the older immutable candidate and explains the
old GitHub status.

Backend candidates cannot require frontend-first deployment. For coupled work,
register backend first and declare it as the frontend prerequisite.

## Staging lifecycle

1. The scheduler claims a dependency-closed set with zero fixed batch delay.
2. Frontend/backend composition and preparation run concurrently.
3. A single exact PR merge-tree artifact is reused when eligible. Otherwise,
   each application runs one combined sharded preflight and one immutable build.
   Frontend staging/production profiles build concurrently into one checksummed
   dual-profile artifact.
4. Preparation may finish while another train owns staging.
5. The train acquires the staging lock only for deployment plus E2E.
6. Independent backend DAG frontier units deploy concurrently; dependency edges
   serialize only required units. Dependent frontend deploys after backend.
7. The controller persists `STAGING_DEPLOYED` with exact SHAs, artifact digests,
   services, operation runs, and timings.
8. E2E receives and authorizes against that manifest identity. Staging remains
   locked until E2E is terminal.
9. Only E2E success produces `STAGING_VALIDATED`.

`STAGING_DEPLOYED` and `STAGING_VALIDATED` are separate milestones.

## Production lifecycle

Staging validation never creates production readiness. A developer explicitly
marks the unchanged exact candidate SHA ready through the Deploy UI or the
versioned mark-ready endpoint.

Production selects only explicit candidates. It composes the proposed subset
from current `main`:

- if both exact composed tree SHAs match a validated manifest, reuse its
  validation and immutable dual-profile/backend artifacts;
- otherwise enqueue an exact `PRODUCTION_QUALIFICATION` staging train, run
  manifest-bound E2E, then continue automatically;
- immediately before mutation, require every `main` ref to equal its recorded
  base. A moved ref cancels and requeues the set for fresh qualification;
- advance exact tested commits, deploy the same artifacts in dependency order,
  verify exact versions, run production-safe read-only E2E, and mark
  `PRODUCTION_DEPLOYED`.

V2 does not publish release notes.

## Failure behavior

| Class | Behavior |
| --- | --- |
| Candidate merge/test | Mark the direct candidate `NEEDS_REBASE` or failed; hold only transitive dependants |
| Infrastructure | Bounded idempotent retry; no candidate isolation |
| Retryable deployment | Retry only the failed operation; preserve successful sibling evidence |
| Control plane | Fail the train, requeue candidates, pause automated claiming, retain manual fallback |
| E2E | Keep the manifest unvalidated; do not globally pause unless state is unverifiable |

Every pending GitHub status must map to a visible candidate/train/operation state
and recovery message. Duplicate callbacks and worker invocations reuse immutable
operation identities and never repeat completed mutations.

## Operator rollout and rollback

Deploy additive changes in this order: database migrations, API/UI, then the v2
reconciler. Keep `RELEASE_BUS_V2_MODE=OFF` and controls paused during offline
and synthetic validation. For staging beta, set mode `STAGING`, resume `STAGING`
and `ALL`, and keep `PRODUCTION` paused. Enable `PRODUCTION` only after staging
acceptance passes; production remains explicit.

Rollback:

1. pause v2 `ALL` and set mode `OFF`;
2. allow any already-dispatched exact operation to reach a safe terminal state;
3. verify no v2 train owns staging or production;
4. use the serialized manual fallback;
5. preserve v2 rows and v1 code for diagnosis—do not destructively delete them.

Never cancel another actor's shared workflow or force-push a shared ref.
