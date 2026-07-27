# Simple Release Bus v2

Simple Release Bus v2 is the deployment authority for exact frontend/backend
candidate SHAs when its live mode enables a lane.

## Route every request from live state

Run:

```bash
./bin/6529 exec node ops/scripts/release-bus-status.mjs
```

The helper reads `/deploy/release-bus-v2/controls` and fails closed when the
authenticated status request is unavailable or malformed.

| Mode         | Staging                 | Production                                                                                    |
| ------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| `OFF`        | Serialized manual route | Serialized manual route with explicit owner authority; prior staging evidence is not required |
| `STAGING`    | V2 readiness            | Production remains manual/disabled                                                            |
| `PRODUCTION` | V2 readiness            | Separate explicit v2 action for an exact `STAGING_VALIDATED` candidate                        |

For an active mode, `ALL` and the target lane must be running. In `OFF`, paused
v2 controls are expected and the serialized manual fallback remains available.

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

1. The scheduler starts from the authoritative cumulative admitted-staging set,
   carries every unchanged exact live candidate forward, and adds a
   dependency-closed set of newly ready candidates with zero fixed batch
   delay. A later ordinary train cannot omit or evict an admitted candidate.
2. Frontend/backend composition and preparation run concurrently.
3. A single exact PR merge-tree artifact is reused when eligible. Otherwise,
   each application runs one combined sharded preflight and one immutable build.
   Frontend staging/production profiles build concurrently into one checksummed
   dual-profile artifact. For an affected repository, the staging release
   commit has the recorded current `1a-staging` SHA as its first parent and the
   dependency-closed composition as its second parent.
4. Preparation may finish while another train owns staging.
5. The train acquires the staging lock and repeats the idle/ref snapshot.
6. Before deployment, every affected `1a-staging` ref advances to the immutable
   release commit through a non-force compare-and-swap from its recorded base.
   Unaffected repositories do not move. A stale or moved ref starts no train
   deployment and pauses only staging for serialized recovery.
7. Independent backend DAG frontier units deploy concurrently; dependency edges
   serialize only required units. Dependent frontend deploys after backend.
8. The controller persists `STAGING_DEPLOYED` with exact SHAs, artifact digests,
   services, operation runs, and timings.
9. E2E runs from an immutable ref at the exact frontend release SHA and receives
   the paired manifest identity. Staging remains locked until E2E is terminal.
10. Only E2E success plus exact agreement among both `1a-staging` refs, runtime
    evidence, the manifest, and E2E produces `STAGING_VALIDATED`.

Ref advances are durable and retry-safe. A crash after CAS resumes by observing
the exact target and continues with the same deployment idempotency keys. A
post-CAS deployment or E2E failure cannot validate; rollback creates a new
forward-only restore commit with the last validated tree, advances
`1a-staging` by non-force CAS, deploys that exact commit, and requires rollback
E2E. Recovery never force-pushes a shared ref backward.

`STAGING_DEPLOYED` and `STAGING_VALIDATED` are separate milestones.
`STAGING_VALIDATED` is historical certification; it is not a current-presence
marker. The Deploy UI's current-live badge, the candidate
`staging_live_state`/`staging_live_manifest_id`, and the controls response
`staging_state` identify the authoritative current shared staging manifest.

The first cumulative claim after rollout bootstraps only from the exact current
pair of `1a-staging` refs, a matching terminal validated manifest, its
successful manifest-bound E2E operation, and every immutable candidate identity
recorded in that manifest. Missing or ambiguous evidence blocks a new claim.
An already-claimed legacy train finishes under its immutable policy first.

Supersession replaces an admitted exact SHA only after the cumulative
replacement manifest validates. Explicit audited removal and safe absorption
into `main` are the only other ordinary ways to leave the admitted set.
The departing candidate's declared units are redeployed from the new
candidate-free composition so prior runtime bytes cannot survive. Production
selection never changes shared staging membership.

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

| Class                | Behavior                                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate merge/test | Before shared mutation, fail closed and leave the last validated admitted manifest live; mark only the new direct candidate `NEEDS_REBASE` as applicable                                                 |
| Infrastructure       | Bounded idempotent retry; no candidate isolation                                                                                                                                                         |
| Retryable deployment | Retry only the failed operation at the same release SHA and idempotency key; preserve successful sibling evidence                                                                                        |
| Control plane        | Fail the train, requeue candidates, pause automated claiming, retain manual fallback                                                                                                                     |
| E2E                  | Keep the failed manifest unvalidated and forward-CAS, deploy, and E2E an immutable restore commit with the exact last validated tree under the same staging lock before committing any membership change |

Every pending GitHub status must map to a visible candidate/train/operation state
and recovery message. Duplicate callbacks and worker invocations reuse immutable
operation identities and never repeat completed mutations.

## Operator rollout and rollback

Deploy additive changes in this order: database migrations, API/UI, then the v2
reconciler. Run the old status helper before migration/API mutation; after the
API is live, use the new helper, which requires and displays authoritative
`staging_state`. Do not deploy the cumulative reconciler before both migration
and API are live. Keep `RELEASE_BUS_V2_MODE=OFF` and controls paused during
offline and synthetic validation. For staging beta, set mode `STAGING`, resume
`STAGING` and `ALL`, and keep `PRODUCTION` paused. Enable `PRODUCTION` only after
staging acceptance passes; production remains explicit.

The cumulative-staging migration has an intentionally non-destructive `down`.
Migration rollback leaves the additive table and columns in place so an older
worker cannot erase the authoritative admitted set. A genuine schema teardown
requires a separate destructive migration and is allowed only while v2 is
confirmed `OFF`.

Rollback:

1. pause v2 `ALL` and set mode `OFF`;
2. allow any already-dispatched exact operation to reach a safe terminal state;
3. verify no v2 train owns staging or production;
4. use the serialized manual fallback;
5. preserve v2 rows for diagnosis—do not destructively delete them.

Never cancel another actor's shared workflow or force-push a shared ref.
