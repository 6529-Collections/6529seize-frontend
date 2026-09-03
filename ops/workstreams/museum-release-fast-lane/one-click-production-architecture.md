# One-click production operation

**Historical design; deployment sections superseded on 2026-09-03.**
Current deployments follow [Deployment](../../docs/developer/deployment.md)
and the existing GitHub Actions workflows. The bus restoration, shared lease,
and coordinator requirements below no longer apply. Retain the recorded
performance findings, incident evidence, and applicable artifact/test design
for context; this document does not authorize restoring retired automation.


Status: implementation design, 2026-08-06

This document defines the replacement for the current multi-dispatch frontend
production procedure. It is a control-plane design, not release evidence. Live
Release Bus state and the exact workflow records remain authoritative.

## Decision

One invocation of **Web Deploy - PROD** owns one immutable production
operation from source selection through production E2E. The operation freezes
an exact commit already contained in protected `main`, acquires the shared
cross-repository production lane, obtains or builds one exact artifact,
verifies that artifact on an isolated runner, deploys it through a separate
AWS-authorized job, and automatically runs read-only production E2E.

Later commits may advance `main` without invalidating the operation. The frozen
commit must remain in `main` history, and the operation must retain its
unrevoked control epoch and production lease. A newer `main` head is not an
authorization to change the selected source.

## Why this change is required

The present procedure distributes one release across several manual actions:

1. wait for or manually dispatch a production artifact build;
2. dispatch the production deploy;
3. wait for a separate production E2E dispatch and verifier;
4. reconstruct the relationship between those runs after the fact.

This creates avoidable idle time and weakens the operator's mental model. It
also exposed four concrete control defects during the 2026-08-06 release:

- the deploy selected the latest artifact matching a SHA instead of an
  artifact bound to the current operation;
- the manual readiness endpoint proved a momentary predicate but did not
  reserve the cross-repository production lane;
- a delayed retry could race another frontend or backend production actor;
- a double-normalized Elastic Beanstalk response made a healthy exact deploy
  time out for 22 minutes and suppressed automatic production E2E.

The redesign removes the manual gaps and makes every authority explicit.

## Non-negotiable invariants

1. **One source.** `target_sha` is a 40-character commit selected once. Every
   builder, verifier, deploy, version check, E2E run, callback and evidence
   record uses that value.
2. **Protected history.** `target_sha` must be reachable from protected
   `origin/main` when the operation is acquired and immediately before AWS
   mutation. Equality with the moving head is unnecessary.
3. **One operation.** `operation_id` is generated before child work and is
   present in the lease, artifact metadata, immutable artifact selection,
   deployment manifest and E2E evidence.
4. **One shared lane.** Frontend and backend production mutations use the same
   authoritative production-environment lease. GitHub concurrency groups are
   defense in depth; they are not cross-repository authority.
5. **Revocation wins.** The operation records the control epoch returned at
   acquisition. Any pause, hard stop, owner revocation or epoch change blocks
   renewal and therefore blocks AWS mutation.
6. **No authority blending.** The builder cannot deploy. The artifact verifier
   has neither build-time secrets nor AWS authority. The deploy job does not
   trust files left by either job and independently verifies the immutable
   selection it downloads.
7. **No discovery by recency.** An existing artifact is accepted only by exact
   workflow run ID, artifact ID, GitHub digest, source SHA and operation
   binding. “Latest matching” is forbidden.
8. **No blind retry.** A 409 or unavailable control plane terminates the
   attempt with a persisted bounded denial reason and observed epoch. A new
   attempt must repeat authoritative acquisition; elapsed time alone never
   grants authority.
9. **Automatic qualification.** A successful exact deploy dispatches
   production E2E automatically. The operation is successful only after the
   read-only packs and their fresh isolated evidence verifier succeed.
10. **Truthful terminal state.** Failure, cancellation and timeout release or
    expire the lease without recording a successful deployment. Healthy
    runtime observations never convert a failed workflow into qualified
    evidence.

## Trust boundaries

| Component             | Authority                                                                | Explicitly absent                                        |
| --------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| Operation controller  | Release Bus workflow credential; read/write Actions metadata             | AWS credentials; build-time secrets                      |
| Artifact builder      | Read repository; build-time API and Sentry secrets                       | AWS deploy credentials; Release Bus mutation credential  |
| Artifact verifier     | Read repository and exact Actions artifact                               | AWS credentials; build-time secrets; write access        |
| Deploy job            | Exact immutable selection; scoped AWS production role; deployment record | Ability to choose a different source or artifact         |
| Production E2E        | Read-only application access; Release Bus progress callback              | Application mutation authority; AWS deploy credentials   |
| Isolated E2E verifier | Immutable selection and E2E evidence artifacts                           | Dependencies or environment inherited from deployed code |

The deploy job runs in the protected `production` environment. Its first
AWS-capable step occurs only after exact-run lease renewal succeeds.

## Operation sequence

```text
operator click
  -> freeze target_sha + operation_id
  -> authoritative drain and lease acquisition
  -> select exact reusable artifact
       or invoke isolated exact-SHA builder
  -> fresh artifact verifier emits immutable selection
  -> deploy job re-downloads and verifies selection
  -> authoritative lease/epoch renewal
  -> AWS upload and Elastic Beanstalk deploy
  -> exact stable-state and /api/version verification
  -> automatic read-only production E2E
  -> fresh isolated E2E evidence verification
  -> complete operation and release lane
```

The builder and verifier are standalone child workflows dispatched by the
controller with exact operation-bound titles and inputs. The controller accepts
only a unique exact run identity; zero matches means absent and more than one
eligible match is an ambiguity failure. They remain part of the same
user-visible operation and require no additional operator action.

For the GitHub Actions entry point, the operation ID is derived from the
repository and immutable workflow run ID; `run_attempt` is recorded separately.
A rerun therefore remains the same operation but must bind and authorize its
new exact attempt. A Deploy Hub entry point may mint the operation ID before
dispatch and pass it to the workflow for exact binding.

## Production lease contract

The backend Release Bus is the only system capable of serializing frontend and
backend production work. The frontend workflow consumes a versioned API with
five operations:

### Prepare and acquire

The controller submits:

- repository, environment and service;
- `operation_id`;
- `target_sha` and source ref;
- requested lease duration.

The backend validates the trusted controller request, protected-main ancestry,
effective production controls, the production lock, active trains,
nonterminal operations and active frontend/backend production mutation or E2E
runs. The check and lock acquisition occur in one authoritative transaction.
An operation that has not yet bound a GitHub run receives a short expiry. This
form exists for a trusted external controller that acquires before dispatch; it
does not ignore an unverified workflow run during the drain check.

The response returns:

- a non-secret operation handle;
- lease expiry;
- control epoch and lock row version;
- normalized operation identity;
- the authoritative observation time.

The database lock token remains server-side in the persisted operation. It is
never transported through GitHub job outputs, artifacts or logs.

### Acquire and bind the exact workflow run

The first job of **Web Deploy - PROD** supplies its path, run ID, run attempt,
source SHA and operation ID. The backend independently reads that in-progress
first-party workflow, excludes only that verified run from the active-workflow
drain, and acquires and binds the lease in one transaction. A foreign or merely
claimed run ID is never an exclusion. This avoids the self-denial that would
occur if an already-running deployment tried to acquire while treating itself
as a foreign active mutation.

A trusted Deploy Hub controller may call prepare before dispatch and let the
new workflow bind afterward. The GitHub Actions one-click entry point uses the
atomic acquire-and-bind form before dispatching any builder, verifier or
deployment work. Both paths use the same persisted state machine.

### Renew and authorize mutation

Immediately before AWS credentials are configured, the deploy job supplies the
same operation identity and handle, `target_sha`, expected control epoch and
immutable artifact-selection digest. The existing Release Bus workflow
credential authenticates the request. The backend revalidates GitHub run
identity, protected-main ancestry, lease ownership, expiry, controls and
revocation state. A successful response extends the lease for the bounded
deployment/E2E window and returns an authorization record bound to the exact
selection digest. The default renewal window is 130 minutes. That covers the
existing 22-minute Elastic Beanstalk readiness ceiling, the configured
90-minute automatic E2E ceiling and callback margin. A 150-minute hard expiry
still bounds a lost callback or runner.

### Complete or fail

Failure is idempotent and releases the caller's lease when safe. Completion is
stricter: it requires the exact successful production E2E workflow run and
attempt, the isolated-verifier evidence digest, and the already-bound artifact
selection digest. The backend independently verifies the qualifier workflow
identity and persists those fields before releasing the lock. Deployment
success alone cannot complete an operation. If the callback is unavailable,
expiry provides bounded recovery and the operation remains visibly
unqualified.

The manual backend production workflow uses the same lock and the same
acquire/bind/reauthorize state machine. Its completion predicate is
repository-specific: the backend verifies the exact completed-success
`Deploy a service` run, service, source SHA and immutable deployment-evidence
digest. It does not substitute that evidence for frontend qualification. A
frontend operation keeps the lock through automatic production E2E; a backend
operation keeps it through its exact service verification. Consequently,
frontend E2E cannot overlap a backend mutation, and neither repository can win
a race by observing an idle lane before the other acquires it.

### Denial evidence

Every rejected acquisition or renewal stores a bounded code and message,
operation identity, target SHA, observed epoch and observation time. Secrets,
authorization headers and raw upstream responses are excluded.

## Exact artifact contract

The builder accepts only `target_sha` and `operation_id` from the controller.
It verifies that the target is in protected `main` history, checks out that
exact object, uses the pinned toolchain and produces:

- the packaged application;
- `manifest.json` with workflow, run, source, operation and package identity;
- `SHA256SUMS` covering the complete regular-file inventory;
- the existing portability inventory and contract;
- the GitHub artifact ID and API digest.

The artifact name contains both the producer operation and source identities.
The controller dispatches the builder on protected `main` and locates it only
by the exact operation-bound display title, trusted workflow path, repository,
branch and event. It fails if that identity is ambiguous; it never selects a run
by creation time.
The production operation may reuse bytes only from either an earlier attempt
of the same workflow operation or an exact artifact run, artifact ID and API
digest carried in trusted staging/release-candidate evidence for the same
`target_sha`. In both cases a fresh verifier adopts and binds the bytes to the
current production operation. If neither explicit identity exists, the
controller invokes one builder. It never queries for the newest matching
artifact.

The isolated verifier downloads the artifact by explicit run and artifact ID,
checks the producer workflow and immutable source, compares the independent
GitHub artifact digest, verifies exact file membership and every checksum, and
recomputes the package digest. Its output is a small immutable selection record
containing only public identifiers and digests.

The verifier is likewise a standalone exact-input child workflow. Its run and
selection artifact are located by exact operation-bound identity and ambiguity
is fatal. This gives the verifier its own workflow-run provenance and a fresh
runner without inheriting builder files, environment or credentials.

The deploy job downloads that selection from the current operation, verifies
its digest, then downloads and verifies the selected package again. It does not
reuse the verifier workspace or environment.

## Failure and recovery

| Failure point                           | Result                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| Lane is not drained                     | Acquisition denied; no builder or deploy starts                 |
| GitHub identity cannot be proven        | Fail closed; denial is persisted                                |
| Existing artifact is absent             | Invoke the isolated builder automatically                       |
| Builder fails                           | Operation fails; no AWS authority was present                   |
| Artifact verification fails             | Operation fails; deploy job never starts                        |
| Control epoch changes                   | Renewal denied; no AWS mutation                                 |
| Main advances but still contains target | Continue with frozen target                                     |
| Target leaves protected main history    | Renewal denied                                                  |
| AWS deploy fails before exact readiness | Operation fails; runtime state is reported truthfully           |
| Readiness or `/api/version` fails       | No production E2E qualification                                 |
| Product E2E fails                       | Deployment remains visible but unqualified; no success record   |
| Terminal callback fails                 | Lease expires; operation remains non-successful and recoverable |

Cancellation is cooperative. It cannot release another operation's lease and
cannot convert a nonterminal AWS mutation into an idle lane.

A GitHub “rerun failed jobs” action must not resume behind an authorization
job from an earlier attempt. Each run attempt reacquires or renews the backend
lease using its own exact `run_attempt` before child work. This prevents a
runner or marketplace outage from turning an old green guard into current
deployment authority.

## Workflow topology

The user-facing workflow remains `.github/workflows/build-upload-deploy-prod.yml`
and retains the name **Web Deploy - PROD**. Its job graph is:

```text
acquire-and-bind
  -> exact-artifact-controller
       -> reuse-explicit-artifact
          or dispatch-and-wait-exact-builder
       -> dispatch-and-wait-exact-verifier
  -> deploy
  -> automatic-production-e2e
  -> isolated-e2e-verifier
  -> complete
```

Failure-finalization runs with `if: always()` and reports the truthful terminal
state. It cannot override a successful completion or release a lease owned by
another operation.

`production-build-artifact.yml` loses its `push` trigger. It remains callable
by the controller and may retain an explicit maintainer dispatch for diagnosis,
provided that dispatch requires exact source and operation inputs and grants no
deployment authority.

## Acceptance tests

The change is not releasable until automated tests prove:

- later `main` descendants do not change or invalidate the frozen target;
- a target absent from `main` history fails before build;
- a frontend operation blocks backend production acquisition and vice versa;
- the acquiring workflow may exclude only its independently verified own run;
- a claimed foreign run ID cannot create an active-workflow drain exception;
- control-epoch change or expiry blocks AWS authorization;
- a 409 produces terminal denial evidence and no timed retry;
- a failed-job-only rerun cannot reuse authorization from an earlier attempt;
- an exact reusable artifact avoids a build, while absence invokes exactly one
  builder;
- an artifact with a forged run, ID, digest, manifest, operation, checksum,
  member, symlink or package byte fails in the isolated verifier;
- the deploy job cannot run from unverified artifact bytes left in another job;
- builder and verifier jobs have no AWS authority;
- deploy authority is not available before successful renewal;
- successful readiness requires two consecutive exact Green/Ready/version
  observations using the real AWS adapter output shape;
- production E2E is dispatched once and only after exact deployment success;
- the isolated E2E verifier alone can mark qualification successful;
- deployment success without exact E2E run/attempt and evidence digest cannot
  complete the backend operation;
- failure and cancellation cannot release a foreign lease.

A static workflow-DAG contract also records the longest dependency path and
fails if artifact discovery, staging qualification and other independent work
are accidentally serialized.

## Measured timing model

This model separates observations from forecasts. The most comparable recent
successful release took **46 minutes 59 seconds** from production-artifact
start to terminal production E2E (Actions runs `30977459534`, `30977518490`,
`30978079115`, `30978958753`, and `30979315540`).

The 2026-08-06 incident sequence reached terminal failure after **66 minutes
18 seconds**. About 18 minutes were spent between a rejected production
attempt, manual retry and delayed authorization; the readiness contract defect
then consumed its full 22-minute timeout. Those are control-path losses, not
application build time.

Recent successful run samples give these approximate stage envelopes:

| Stage                                 | Best | Median | Conservative p95 sample envelope |
| ------------------------------------- | ---: | -----: | -------------------------------: |
| Production artifact build             | 8.0m |  13.8m |                            14.6m |
| Staging artifact build                | 6.1m |  11.3m |                            12.1m |
| Staging deploy                        | 1.4m |   1.5m |                             4.3m |
| Staging E2E                           | 5.3m |  10.9m |                            17.4m |
| Production deploy with exact artifact | 5.1m |   6.3m |                             7.7m |
| Production E2E                        | 2.8m |  10.9m |                            14.1m |

These p95 values are conservative envelopes over small samples, not a mature
service-level estimate. With the production artifact lane overlapping staging,
the predicted one-click critical path is approximately **21 / 42 / 58
minutes** best / median / conservative p95. Serializing the production build
before staging would raise that prediction to approximately **29 / 56 / 72
minutes**. The implementation therefore treats accidental build serialization
as a contract failure.

At the median, the parallel forecast is **25% faster** than the serialized
forecast, **10.6% faster** than the comparable 46-minute-59-second observed
release, and **36.7% faster** than the 66-minute-18-second incident sequence.
These percentages are planning comparisons over the stated evidence, not a
production service-level claim.

That overlap requires the staging/release-candidate path to start the
credentials-free production builder and persist its exact run, artifact ID and
digest as candidate evidence. **Web Deploy - PROD** consumes that explicit
identity after staging succeeds. If candidate evidence has no production
artifact, the one-click operation builds on demand and follows the slower
serialized envelope. Staging bytes themselves are never promoted: staging and
production builds currently contain different environment configuration.

The one-click controller alone does not satisfy the workstream's 25-minute p95
target. It removes operator idle time and control races; the remaining median
is dominated by two environment E2E phases and the staging build. Reaching the
target requires measured follow-ups: activate a proven higher-throughput build
runner, keep dependency and browser caches warm, run independent read-only
packs in parallel, retain full Museum coverage only for Museum/release-control
changes, and keep ordinary production qualification to exact changed surfaces
plus the environment-wide smoke floor. None of those optimizations may replace
the exact-source, staging-before-production or isolated-evidence gates.

The deterministic DAG fixture uses fixed synthetic durations and expects this
trace:

```text
preflight          0–1
staging-build      1–9   ┐
prod-build         1–9   ┘ parallel
staging-deploy     9–11
staging-e2e       11–22
prod-deploy       22–29
prod-e2e          29–40
```

Reuse must record zero production builds; the absent-artifact case must record
exactly one. Any additional build event or dependency from the production
builder to staging E2E fails the contract.

## Rollout

1. Land and production-qualify the readiness-normalization hotfix separately.
2. Add the backend lease API and persistence with existing manual readiness
   behavior unchanged.
3. Deploy the backend API while the production lane is authoritatively OFF and
   drained; exercise acquisition/renewal/failure against synthetic workflow
   identities without AWS mutation.
4. Land the frontend builder, verifier and controller integration.
5. Qualify the frontend change in staging, including forced absent-artifact,
   tamper, revocation and cross-repository contention cases.
6. Use the new single operation for its first production deployment and retain
   exact run, artifact, lease, readiness, E2E and timing evidence.
7. Keep the current serialized manual workflow available only as a documented
   rollback until the first bounded production observation window closes.

The older Deploy Hub pull requests are source material, not merge candidates.
Their modular workflow clients and dry-run planning may be reused only after
the exact-SHA, artifact-binding, isolated-verifier and shared-lease invariants
above are met.
