# Staging and Production Deployment Bus

Status: implemented behind rollout controls. The live API mode selects the
release route; repository enforcement separately controls whether a manual
route requires audited break glass.

## What changes for developers

The live rollout mode is authoritative. The canonical agent preflight in both
repositories is:

```bash
node ops/scripts/release-bus-status.mjs
```

The helper requires an installed, authenticated `gh`, obtains its token
internally, calls the production controls API, validates the mode plus `ALL`,
`STAGING`, and `PRODUCTION`, and prints only sanitized state:

```json
{
  "mode": "OFF",
  "controls": {
    "ALL": "RUNNING",
    "STAGING": "RUNNING",
    "PRODUCTION": "RUNNING"
  }
}
```

Run it when a release request arrives, immediately before readiness, immediately
before a manual merge or workflow dispatch, and again before production after a
significant wait. Do not substitute documentation, conversation state, a
previous release's mode, workflow configuration, AWS assumptions, repository
files, or the browser UI. A signed-in browser session alone does not authenticate
the Release Bus API; the helper deliberately uses the developer's authenticated
`gh` session.

Status discovery is fail-closed. Missing or unauthenticated `gh`, timeouts,
network or authentication errors, malformed JSON, unknown modes, and incomplete
controls all stop the release before mutation. Failure never means `OFF` and
never means “bus enabled.” Agents must not fall back to AWS CLI, queue a
candidate, merge, or deploy while status is unknown.

| Live mode    | Staging behavior                                                 | Production behavior                                                         |
| ------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `OFF`        | Use the legacy manual path; do not queue in the bus              | Use the legacy manual path                                                  |
| `SHADOW`     | Record the candidate for shadow evaluation, then deploy manually | Record shadow evidence as designed, then deploy manually                    |
| `STAGING`    | Submit through the Release Bus and wait for validation           | Follow the operator/manual production path; do not queue a production train |
| `PRODUCTION` | Submit through the Release Bus                                   | Submit the staging-validated SHA through the Release Bus                    |

If `ALL` or the relevant lane is paused, stop and report the paused scope.
After an active bus lane accepts a candidate, do not start a parallel manual
deployment.

For a manual route, inspect `RELEASE_BUS_ENFORCEMENT` in every affected
repository with authenticated `gh`. `OFF` or `SHADOW` combined with enabled
enforcement is a configuration mismatch and requires an operator. If the
manual route is enforced, only an organization owner or active
`release-bus-operators` member may continue, with a non-empty audited
break-glass reason. Never bypass a blocked workflow.

Developers and agents no longer need to merge feature branches into
`1a-staging`, dispatch staging deployments, merge source PRs to `main`, or
dispatch production deployments on a lane currently owned by the bus.

When the table selects a bus route, use the Release Bus panel at
`/deploy/ui/bus`:

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

Submitting live readiness creates a pending `Release Bus` commit status. A
successful validation completes it, and cancelling a candidate with an
existing live status completes it as `release readiness cancelled` so source
PRs are not left with a permanent pending status.

## Reading an active train

The active-train card on `/deploy/ui/bus` is authoritative for train progress.
It shows the current phase, elapsed time, exact operation, expected SHA,
included candidates, worker heartbeat, last meaningful event, and the durable
event timeline. When the operation is a GitHub Actions run, it also shows the
run ID, a direct allowlisted link, and the active or failed job and step.

The train phases are explicit: `COLLECTING`, `FROZEN`,
`BASE_CANARY_RUNNING`, `COMPOSING`, `PREFLIGHTING`, `ISOLATING_FAILURE`,
`DEPLOYING_BACKEND`, `DEPLOYING_FRONTEND`, `E2E_RUNNING`,
`VALIDATING_STAGING`, `MERGING_PRODUCTION`, `VALIDATING_PRODUCTION`,
`SYNCING_STAGING`, and the terminal or control states `PAUSED`, `COMPLETED`,
`FAILED`, `ROLLED_BACK`, and `CANCELLED`. `FROZEN` means only that the
candidate set and base SHAs are immutable. It must never be used as a generic
label for an active canary, workflow, deployment, or lease wait.

Every worker `WAIT` includes both `wait_reason` and `current_operation` (which
is explicitly `null` during a bounded transition with no operation yet). The
reason states exactly what is awaited, for example a GitHub workflow, a
non-workflow operation, an external deployment, a paused control, or a
specific lease. Lease owner, heartbeat, and expiry appear only after an actual
lease acquisition guard fails; an active workflow is never diagnosed as a
lease failure.

Long-running and stalled are different states. Recent workflow/job/step
progress remains `RUNNING`. A base canary, preflight, or isolation workflow is
`STALLED` only after 60 minutes without progress; frontend deployment after 45
minutes; backend deployment or E2E after 30 minutes; and composition, merge,
or staging synchronization after 15 minutes. A stalled card names the
deterministic reason, such as workflow reconciliation stale, workflow not
discovered, or no recent workflow progress. Do not retry while GitHub still
shows a healthy active run.

During a base canary, the incident card says: “Frontend base canary running
for staging SHA … Candidates have not been tested yet.” If it fails, the card
says: “Existing staging base failed … No candidate was blamed. STAGING was
paused.” It also lists the failed gate/job/step, exact failing Jest suite/test
when reported, candidates returned or quarantined, and the recommended
recovery. For a base failure, repair and validate the existing staging base,
deploy that isolated repair, verify it, and only then resume the lane. Do not
change, cancel, or blame queued candidates to work around a base failure.

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

- runs the shared frontend validation/build gate against the exact fresh
  `1a-staging` base before composing any frontend candidate, so a broken base or
  control-plane command cannot be blamed on candidate code;
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

- When `RELEASE_BUS_CODEX_ENABLED=true`, safe allowlisted conflicts on temporary
  train branches may be offered to a constrained Codex job. Deterministic
  validation checks the result. Deployment, schema, authentication,
  authorization, and instruction conflicts are never auto-resolved.
- Codex is optional and read-only during failure diagnosis. Without it, the
  bus publishes the conflict-free candidate prefix (which can be empty when
  the first candidate conflicts), verifies candidate ancestry, quarantines the
  first omitted immutable candidate, and returns the others to the queue.
  Deterministic isolation and failure attribution still work; structured gate
  evidence remains the operator source of truth.
- Isolation uses non-secret placeholder analytics and Sentry values. It helps
  diagnose deterministic candidate failures but does not replace the real
  preflight build or prove behavior that depends on credential value formats.
- Reproducible composition or preflight failures enter candidate isolation. A
  clean base and every dependency-closed candidate subset are checked, plus one
  bounded combined retry. Only a subset-proven offender is quarantined; a base
  failure or combined-only interaction pauses the lane instead of guessing.
  Independent candidates return to the queue and a proved offender's PR
  receives a diagnostic link.
- Frontend lint, typecheck, Jest, and build commands are owned by one shared
  Release Bus gate. Pull-request CI executes the gate's regression contract
  whenever that gate or a Release Bus workflow changes. Before candidate
  composition, the bus also runs the full gate against the exact recorded
  frontend base SHA. A base-canary failure requeues every candidate and pauses
  the lane without quarantining a developer branch.
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

Each control shows its current reason and actor. When an automatic pause came
from a trusted 6529 GitHub Actions run, the control also links directly to that
failure evidence.

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
