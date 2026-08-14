# Simple Release Bus v2

Simple Release Bus v2 is the deployment authority for exact frontend/backend
candidate SHAs when the target environment's effective lane is `ON`.

## Route every request from live state

Run:

```bash
./bin/6529 exec node ops/scripts/release-bus-status.mjs
```

The helper reads `/deploy/release-bus-v2/controls`, verifies the hidden safety
fences, and fails closed when the authenticated status request is unavailable,
malformed, or internally inconsistent. Its operator-facing result contains
only:

| Effective lane | `ON`                                                                                | `OFF`                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Staging        | Register exact candidates with Release Bus                                          | If `changeable: true`, serialized manual staging after the staging drain gate                                                                                |
| Production     | Separately select an exact `STAGING_VALIDATED` candidate for Release Bus production | If `changeable: true`, serialized manual production after the production drain gate and explicit owner authorization; prior staging evidence is not required |

The drain gate requires the target environment lock to be free, no target
mutation/E2E workflow to be active, and every already-dispatched exact
operation to be terminal. Both lanes `OFF` means full manual fallback after both
drain gates. Raw `RELEASE_BUS_V2_MODE` and `ALL` remain internal emergency
fences; they are not normal routing or UI controls and must never be bypassed.

There is no inferred control-plane or self-upgrade exception. While a target
lane is `ON`, every deploy for that environment—including API, `releaseBus`,
cleaner/reconciler, and other control-plane changes—must be an authenticated
Release Bus operation. Manual workflow dispatch is fallback only after the
helper authoritatively reports the affected lane `OFF` and the drain gate
passes. The helper must also report `changeable: true` and verify that no hidden
emergency fence blocks fallback. If Release Bus cannot safely self-deploy while
`ON`, stop for explicit owner direction; never infer an exception from the
component or GitHub actor.

The legacy frontend staging and production workflows enforce this routing as
their first job. They authenticate the exact current GitHub run with the
backend readiness endpoint and reject before checkout, build, ref, credential,
or deployment mutation unless the target lane is authoritatively `OFF`,
`changeable: true`, free of hidden fences, and fully drained. Release Bus
operations use the dedicated immutable-artifact workflows and their normal
operation authorization; a valid operation identity never converts a legacy
rebuilding workflow into a train deploy path.

## Dashboard read model

`/deploy/ui/bus` presents Staging and Production as the two developer-facing
lanes. Each lane shows its effective `ON`/`OFF` state, the exact frontend and
backend SHAs currently deployed, the last successfully validated exact SHAs,
and three train views:

- the currently active train, if one has been claimed;
- the projected next train if the queue does not change; and
- terminal train history, loaded incrementally.

The projected train is read-only planning output. It is never claim evidence and
may change until the reconciler persists a train. Train cards split backend and
frontend candidates and retain exact PR, SHA, status, membership, dependency,
and backend deployment-DAG data. Locks, manifests, workflow runs, operations,
errors, and durable events remain available inside the train's expandable
diagnostics rather than as separate top-level dashboards.

The shared Pull requests view lists every registered exact candidate and can be
filtered by PR number or status. Public users can inspect this state without a
GitHub token. Authentication reveals only the lane and candidate actions that
can mutate state. The UI is a human read model; agents and scripts must continue
to route and validate mutations from the versioned helper and API response.

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
3. Exact green PR merge-tree source and test evidence is reused when eligible;
   artifact bytes are freshly built for the exact staging composition. Backend
   preparation installs dependencies once and builds/packages only selected
   deploy units. Frontend builds only the staging profile and records one
   immutable environment-bound manifest/digest. Focused lint, typecheck, Jest,
   policy, and build checks remain PR CI gates and do not rerun in a normal
   train. The baseline read-only browser inventory runs once against the exact
   deployed staging SHA. The complete Museum institutional-practice pack joins
   that inventory only when the release commit's first-parent diff touches a
   Museum-owned path; an unknown diff fails safe by retaining the pack. For an
   affected repository, the staging release
   commit has the recorded current `1a-staging` SHA as its first parent. When
   the dependency-closed composition adds commits beyond that parent, it is the
   second parent; a fully current empty-cumulative composition intentionally
   produces a single-parent commit. Normal staging composition starts from that
   recorded parent and merges current `main` plus every admitted candidate;
   only rollback deliberately binds a last-validated replacement tree.
4. Preparation may finish while another train owns staging.
5. The train acquires the staging lock and repeats the idle/ref snapshot. A
   carry-forward-only repository must already have `composed_sha` equal to its
   exact `1a-staging` ref or the train fails before any ref advance or deploy.
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

## Exact deployed-baseline adoption

Before preparing an intent or performing any manual deployment, run
`./bin/6529 exec node ops/scripts/release-bus-status.mjs` and follow the
`deploy-6529` instructions. Continue only when both effective lanes are
authoritatively `OFF` and changeable and the required drain gate passes.

The backend provides an operator-only one-shot capability for a separately
authorized brief manual freeze. Deploying the capability is not permission to
invoke it. Keep both effective lanes `OFF` and changeable, keep `ALL` unpaused,
and do not start until the staging lock, staging mutation/E2E workflows and
already-dispatched exact operations are fully drained.

Before moving either `1a-staging` ref or dispatching a manual staging
deployment, prepare one authenticated immutable intent through
`POST /deploy/release-bus-v2/maintenance/adopt-exact-staging-baseline`. Bind
the UUID v4 identity and expiry to the unchanged authoritative staging-state
row version, exact target frontend/backend refs and SHAs, required runtime SHAs,
the single runtime-verifiable `api` deployment unit/SHA, and the exact
zero-or-known candidate inventory/row versions. A non-API unit cannot be
accepted on workflow success alone. Preparation writes only an audited intent:
it creates no train, manifest, operation or lock, and performs no deployment
or ref/state mutation. The target refs and runtimes are revalidated after the
later deployments.

The existing manual backend workflow emits one authenticated terminal event
for each staging service while leaving ordinary no-intent deployments
unchanged. Only the exact API event can advance an intent; a different service
during the held freeze fails that intent closed. Its additive callback step is
non-blocking for the ordinary deploy job: unavailable evidence prevents
adoption freeze without failing an unrelated manual deploy.

The guarded manual frontend fallback builds one exact-SHA staging artifact on
GitHub without deployment credentials,
reconfirms fallback readiness, and uploads the digest-bound bundle temporarily
to `s3://<artifact-bucket>/manual-staging/<run-id>/<sha>.zip`. EC2 receives a
40-minute presigned URL through SSM. The workflow always attempts to remove the
object afterward and emits a job-summary warning if cleanup fails so an
operator can remove the leftover object. The instance verifies, activates, and
version-checks those bytes with rollback; it no longer reinstalls dependencies,
lints, or rebuilds the app.

The small `staging-e2e-dispatch.yml` post-completion listener has no concurrency
group and dispatches `staging-e2e.yml` only when `Web Deploy - STAGING`
concludes successfully on the repository's `1a-staging` branch. GitHub still
records an unavoidable skipped dispatcher wrapper for other conclusions, but
failed, cancelled, timed-out and skipped deployments create no Staging E2E run
and never enter the shared staging E2E concurrency lane. The automatic dispatch
carries the deploy run ID; the E2E workflow resolves that run through GitHub,
requires the exact completed-success same-repository workflow/ref contract,
then the trusted decision client makes one authenticated lookup:

- `LEGACY` means there is no active intent, and the existing expensive
  automatic E2E runs unchanged;
- `DEFERRED` means one unique unexpired intent exactly matches the upstream
  deploy/ref/SHA; frontend deployment/runtime evidence and the defer are
  recorded idempotently, and the expensive packs are skipped;
- unavailable, stale, moved, expired, malformed, ambiguous or
  identity-mismatched evidence fails closed and cannot validate or adopt.

The terminal WEB E2E notification carries that deploy run ID, or the Release
Bus train ID, back to the CI alert receiver. The receiver correlates it to the
original deploy drop and posts the result as a reply; workflows do not handle
drop IDs. Reruns preserve the parent identity and expose attempts greater than
one in the linked run label. See
[CI wave deploy and WEB E2E notifications](ci-wave-deploy-validation-notifications.md)
for standalone fallback, message, activation, and rollout behavior.

The manual production fallback follows the same build-once principle. An
authorized production operation explicitly invokes `production-build-artifact.yml`
with a 40-character `target_sha` and operation-bound `operation_id`; merges to
`main` never start this builder automatically. `operation_id` is restricted to
`^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$`: 1–80 ASCII characters, beginning with a
letter or digit and containing only letters, digits, `.`, `_`, or `-`. The
builder checks out the protected `origin/main` history, proves that both the
producer workflow head and target are ancestors of the fetched protected tip
(so a later `main` descendant is allowed), builds the production profile
without AWS or Release Bus deployment authority, and publishes one 30-day
artifact named `production-frontend-<target_sha>-<operation_id>`. Its v2 package
manifest records the target SHA, `workflow_sha` (the producer run API head,
which may be newer than the frozen target), `protected_main_sha` (the fetched
`origin/main` tip used for the ancestry proof), stable operation identity,
artifact name, package digest, build timestamp, and producer workflow
run/attempt; the run attempt is evidence, not a new operation identity.
`SHA256SUMS` covers that manifest and every package file. The reusable
invocation also returns the explicit artifact ID, artifact digest, producer run
ID, producer workflow head SHA, protected-main SHA, and run attempt so a
verifier can bind the selected bytes to the current attempt without discovering
a newest artifact by name.
The controller may reuse only an explicit `(run_id, artifact_id, digest)` from
an earlier attempt of the same operation or from trusted staging/release-
candidate evidence for the exact target SHA; otherwise it invokes this builder
once. The production verifier freshly adopts that explicit identity into the
current operation before obtaining AWS credentials. It does not install
dependencies or rebuild the application. A missing, expired, foreign,
unsuccessful, mismatched, or malformed artifact fails before production
mutation.

The verifier must require the exact producer workflow path, trusted event,
`main` branch, and same-repository/head-repository identity; bind the API
run's `head_sha` to manifest `workflow_sha`; and validate the builder's
`target_sha`-to-`protected_main_sha` ancestry evidence rather than treating
`workflow_sha` as the target. The verifier branch must therefore consume
`production-prebuild-v2` and the target-before-operation artifact-name order
above.

After a successful manual production fallback,
`production-e2e-dispatch.yml` carries only the completed deploy run ID into
`production-e2e.yml`. The E2E workflow independently reads that run back,
requires the exact same-repository `main` deployment contract, checks out its
deployed SHA, and runs the complete production-safe read-only inventory. Its
evidence deliberately has no Release Bus manifest binding. Release Bus
production operations continue to use their authenticated manifest-bound
inputs and report through the existing operation identity; the two identities
cannot be mixed.

The last exact required frontend/backend deployment event revalidates the state
version, refs, runtimes, candidate membership, OFF controls, drain and staging
lock. Only then does one transaction create the real
`ADOPT_EXACT_DEPLOYED_BASELINE_V1` train, acquire the existing staging lock,
freeze the immutable manifest, and create one manifest-bound `E2E_STAGING`
operation. It dispatches one `staging-e2e.yml` `workflow_dispatch`; if the
frontend event was last, workflow concurrency queues it behind the short
automatic decision run with `cancel-in-progress: false`.
The sole operation identity is
`rb2:<adoption-id>:baseline-adoption-e2e:staging:a1`, so ordinary E2E callbacks
cannot enter its adoption handler.

Only the exact authenticated terminal success of that sole bound E2E may
CAS-adopt the exact pair as authoritative `LIVE` staging state. Final ref,
runtime, control, state-version, candidate, lock, workflow, manifest and
operation identities are all revalidated first. Failure leaves authoritative
state and developer/production intent unchanged and releases only the owned
staging lock. Retries reuse the same immutable intent/operation and cannot
dispatch a second expensive E2E. There is no polling runner, synthetic proof
train, cancellation, bypass, new shared lease/watchdog, automatic handoff or
manual-workflow guard.

## Production lifecycle

Staging validation never creates production readiness. A developer explicitly
marks the unchanged exact candidate SHA ready through the Deploy UI or the
versioned mark-ready endpoint.

Production selects only explicit candidates. An authenticated selection is
atomic: all selected candidates share one `production_selection_id`, every
candidate must still be `STAGING_VALIDATED` at the submitted exact head, and
the set must be transitively dependency-closed. A production prerequisite must
be selected in the same action or already be terminal `PRODUCTION_DEPLOYED`
with exact manifest and successful production E2E evidence. Omitted unrelated
candidates retain their staging evidence and any separate production intent.

If either production base moves before irreversible production mutation, the
old train is cancelled without changing its immutable membership and its exact
explicit intents move to `WAITING_FOR_PRODUCTION_REPLAN`. The next scheduler
transaction creates an audited replacement selection and train from every
currently eligible explicit production intent, including compatible
selections recorded after the old train was claimed. Exact heads, historical
staging train/manifest/E2E evidence, dependencies, ownership, and both current
production bases are rechecked. Audit events map every included source
selection/train to the replacement and retain every omission reason. The
replacement never infers candidates from staging.

If `PRODUCTION_REPLAN_INTENT_SCAN_FAILED_CLOSED` reaches its bounded 500-row
scan cap, no replacement may claim. Wait for production ownership to drain and
use authenticated revoke/cancel actions only for owner-authorized stale
intents, or deploy a separately reviewed cap/pagination change. Never edit the
ledger, discard intent, or split a dependency set merely to unblock the queue.

The replacement boundary closes as soon as either `main` advance succeeds, a
production deploy is dispatched, or production E2E exists. After that boundary
the original exact set remains frozen and only that train may resume or
recover; it is never broadened in place. A nonterminal dispatched operation
retains the production lease while it drains. After terminal drain, the
frozen/paused train releases the lease while the active train and paused
production lane still block every new claim until exact recovery.

New production trains use `CANDIDATE_STAGING_EVIDENCE_V1`:

- persist each selected candidate's exact identity plus its staging train,
  validated manifest, and successful manifest-bound E2E operation/run;
- freshly compose both repositories against the current trusted `main` bases
  and freshly build only the target production profiles/deploy units;
- reuse exact candidate source and PR CI/staging evidence, never staging
  artifact bytes, because production may select a different dependency-closed
  subset than the staging composition;
- fail closed on moved heads, ambiguous or stale evidence, invalid dependency
  closure, composition/check/build/artifact failures, or either stale base;
- persist `PRODUCTION_CANDIDATE_EVIDENCE_QUALIFIED` as an auditable production
  manifest without mutating shared staging;
- never create a legacy `PRODUCTION_QUALIFICATION` child merely because the
  selected set differs from a validated staging manifest;
- compare-and-swap only the exact tested commits, deploy immutable artifacts in
  dependency order, verify exact versions, run production-safe read-only E2E,
  and create `PRODUCTION_DEPLOYED` only after terminal success.

V2 does not publish release notes.

## Failure behavior

| Class                         | Behavior                                                                                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate merge/test          | Before shared mutation, fail closed and leave the last validated admitted manifest live; mark only the new direct candidate `NEEDS_REBASE` as applicable                                                 |
| Infrastructure                | Bounded idempotent retry; no candidate isolation                                                                                                                                                         |
| Retryable deployment          | Retry only the failed operation at the same release SHA and idempotency key; preserve successful sibling evidence                                                                                        |
| Control plane                 | Fail the train, preserve or requeue exact candidates, turn the affected lane off where safe, and permit manual fallback only after its operations are terminal and its drain gate passes                 |
| E2E                           | Keep the failed manifest unvalidated and forward-CAS, deploy, and E2E an immutable restore commit with the exact last validated tree under the same staging lock before committing any membership change |
| Production preflight          | Fail before shared mutation; retry only through a new explicit exact-SHA selection after unchanged staging evidence and terminal compose/preflight operations are revalidated                            |
| Production base moved         | Before irreversible mutation, preserve explicit intent and form an audited replacement from all currently eligible dependency-closed selections; after mutation, freeze the original exact set           |
| Production after main advance | Fail selected candidates closed, turn production off, block later claims, and require exact recorded `main`/runtime parity or an explicit rollback before resuming                                       |

Every pending GitHub status must map to a visible candidate/train/operation state
and recovery message. Duplicate callbacks and worker invocations reuse immutable
operation identities and never repeat completed mutations.

## Operator rollout and rollback

Deploy additive changes in this compatibility order: database migrations,
API/UI, then the v2 reconciler. The effective lane still decides how every step
is dispatched. While the target lane is `ON`, register the exact rollout
candidate and express API-before-reconciler ordering in its Release Bus deploy
plan; the bus must dispatch each workflow with its valid operation identity.
Do not manually dispatch API or `releaseBus` merely because the bus is
upgrading itself. Manual fallback is available only after the helper
authoritatively reports the affected lane `OFF` and its drain gate passes. If a
safe self-deploy path cannot be proven while `ON`, stop for explicit owner
direction. An `OFF` lane with `changeable: false` remains fail-closed; do not
use manual fallback through a hidden emergency fence.

Run the old status helper before any compatible migration/API mutation; after
the API is live, use the new helper, which requires both effective lane states
and the authoritative `staging_state`. Do not deploy the cumulative reconciler
before both migration and API are live. During offline and synthetic
validation, keep both effective lanes `OFF` with the internal hard stop. For
staging beta, expose only staging as `ON`; keep production `OFF`. Turn
production `ON` only after staging acceptance passes; production selection
remains explicit.

The cumulative-staging migration has an intentionally non-destructive `down`.
Migration rollback leaves the additive table and columns in place so an older
worker cannot erase the authoritative admitted set. A genuine schema teardown
requires a separate destructive migration and is allowed only while v2 is
confirmed `OFF`.

Rollback:

1. use the internal hard stop and verify both effective lanes report `OFF`;
2. allow any already-dispatched exact operation to reach a safe terminal state;
3. verify no v2 train owns staging or production;
4. use the serialized manual fallback only after each target drain gate;
5. preserve v2 rows for diagnosis—do not destructively delete them.

Never cancel another actor's shared workflow or force-push a shared ref.
