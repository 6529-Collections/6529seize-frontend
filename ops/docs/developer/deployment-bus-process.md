# Staging and Production Deployment Bus

Status: implemented behind rollout controls. The normal path becomes authoritative
only after the release-bus infrastructure, GitHub App, secrets, repository rules,
and `RELEASE_BUS_ENFORCEMENT` switch are enabled.

## What changes for developers

Developers and agents no longer need to merge feature branches into
`1a-staging`, dispatch staging deployments, merge source PRs to `main`, or
dispatch production deployments on the normal path.

Instead, use the Release Bus panel at `/deploy/ui/bus`:

1. Select frontend or backend and enter the developer branch.
2. Resolve and review its exact 40-character head SHA.
3. Declare cross-repository candidate dependencies. Backend candidates also
   declare allowlisted deploy units and ordering edges.
4. Mark that exact SHA ready for staging.
5. Wait for the bus to compose, deploy, and validate the staging train.
6. After the same candidate shows `STAGING_VALIDATED`, separately mark it ready
   for production.

The staging dependency identities carry forward automatically when production
readiness is submitted without a new dependency list. Supplying a different
list is rejected because candidate metadata is immutable after readiness;
cancel and resubmit the exact SHA if the metadata itself must change.

Readiness belongs to `(repository, branch, head SHA)`, not to a moving branch.
A later branch push does not change a frozen train. It supersedes a queued
candidate and the new SHA must be marked ready explicitly.

This process is universal repository behavior. It does not know about or call
any developer's personal phase skill.

## How a train departs

There can be one frozen or executing train across frontend and backend.
Production-ready work has priority when production mode is enabled. Candidates
that arrive while a train is running remain in the next queue; they cannot join
the already frozen train.

At the next departure the bus:

1. Reconciles queued branch heads with GitHub, even if a webhook was missed.
2. Takes a database cutoff timestamp.
3. Selects candidates committed before the cutoff.
4. Builds the candidate dependency DAG.
5. Holds missing dependencies and their transitive dependants.
6. Keeps unrelated candidates eligible.
7. Freezes the ordered set and exact frontend/backend base SHAs.

A train contains at most 20 candidates by default. Work beyond the configured
cap stays in the queue without changing the frozen train.

For example, if A depends on B and B is not eligible, A waits. Independent C
can still ship even if C was developed later than A and B.

## Staging train

A staging train starts from the recorded frontend and backend `1a-staging`
heads. For each represented repository the bus creates a temporary
`release-bus/staging-train-...` branch and merges candidate SHAs in dependency
order.

It then:

- runs immutable preflight builds;
- deploys backend units in service-DAG order;
- deploys frontend after backend succeeds;
- runs the existing staging E2E packs against the exact train, including for a
  backend-only train by using the currently deployed staging frontend;
- records workflow, SHA, artifact, service, and E2E evidence;
- fast-forwards `1a-staging` only after all required validation passes.

Backend units declared `production-only` in the deploy registry are built and
tested during preflight but are not runtime-deployed to staging. Their staging
gate is the immutable artifact evidence plus the combined application E2E
suite; the bus records that distinction explicitly.

The final `1a-staging` update contains a release-bus marker, so the legacy push
workflows do not deploy the already validated SHA a second time. If
`1a-staging` moved unexpectedly, the train is cancelled and the remaining
candidates are requeued against the new base instead of overwriting it.

## Production train

Only an exact SHA with durable staging validation can be marked ready for
production. A production train starts from fresh `main` in each represented
repository and produces both staging-configured and production-configured
immutable artifacts.

The bus restages and revalidates the exact combined production release set. It
does not treat older candidate-level staging evidence as proof for a newly
combined train.

After the exact train passes staging:

1. The bus creates linked frontend and backend release PRs when needed.
2. It fast-forwards backend `main` with expected-old-SHA protection.
3. It deploys backend units in service-DAG order and verifies deployed code.
4. Only then does it fast-forward frontend `main` and deploy the prebuilt
   frontend artifact.
5. It runs production-safe read-only E2E and exact version checks.
6. It marks candidates `PRODUCTION_VALIDATED`, syncs `main` back into staging,
   and comments on the original source PRs.

If a source branch still points at the released SHA, its source PR is closed as
released. If the branch moved, the PR remains open and the comment states which
recorded SHA shipped.

The existing autonomous release-note service continues to observe successful
frontend and backend production deployments independently. The bus neither
publishes release notes nor invokes the legacy GelatoBot skill.

## Failure behavior

- Safe, allowlisted conflicts on temporary train branches may be offered to a
  constrained Codex job. A separate deterministic job applies and fully tests
  the patch. Deployment, schema, authentication, authorization, and instruction
  conflicts are never auto-resolved.
- Codex is read-only during failure diagnosis. Deterministic checks decide
  whether a candidate is quarantined.
- Reproducible composition or preflight failures enter candidate isolation. A
  clean base and every dependency-closed candidate subset are checked, plus one
  bounded combined retry. Only a subset-proven offender is quarantined; a base
  failure or combined-only interaction pauses the lane instead of guessing.
  Independent candidates return to the queue and a proved offender's PR
  receives a diagnostic link.
- Ambiguous external calls are reconciled by exact operation key before any
  retry. A timeout is not treated as proof that an operation did not happen.
- Before production mutation, an unexpected target-branch move safely cancels
  and requeues the train.
- After production mutation begins, candidate ejection is forbidden. A failure
  stops the train, pauses the affected lane, and requires rollback or operator
  recovery. No service is automatically rolled back unless its committed
  deploy registry explicitly declares and implements a safe rollback adapter.

## Pause and break glass

The operator controls are on `/deploy/ui/bus`. Members of the configured
`release-bus-operators` GitHub team, plus organization owners, may pause or
resume `ALL`, `STAGING`, or `PRODUCTION`, with an audited reason.

A pause prevents the next irreversible operation; it does not interrupt an AWS
deployment already mutating an environment.

The old deploy console and legacy workflows remain available for emergencies.
After enforcement is enabled they require an operator identity and a
break-glass reason. Break glass automatically pauses the affected bus lane and
is rejected while a train is active. Repository rules must also restrict direct
movement of `main` and `1a-staging` to the GitHub App and named operators.

Normal successful staging and production releases require no human approval.
Operators are needed only for deliberate pause/resume, break glass, unsafe
conflicts, or production incidents that cannot use a declared rollback.
