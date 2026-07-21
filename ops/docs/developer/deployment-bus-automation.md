# Deployment Bus Automation and Operations

Status: implementation reference and go-live runbook. Code is feature-gated;
merging it does not by itself enable autonomous deployments.

## Runtime architecture

- The existing application MySQL database is the durable release ledger.
- `releaseBusStarter` runs every minute with reserved concurrency `1`.
- AWS Standard Step Functions keeps one short-running worker invocation per
  state transition and waits between polls.
- `releaseBusWorker` reconciles state and starts the next idempotent operation.
- Each train is pinned to the published worker Lambda version whose code hash
  matched the deployment at departure time. Retained versions let an in-flight
  train finish under one implementation even if newer bus code is deployed.
- `releaseBusCleaner` removes old temporary release-bus branches while
  protecting branches referenced by active trains.
- GitHub Actions composes candidates, builds immutable artifacts, deploys,
  validates, and reports exact evidence.
- A narrowly scoped GitHub App is the machine identity for reads, temporary
  branch writes, release PRs, expected-SHA branch advancement, comments, and
  workflow dispatch.
- `/deploy/ui/bus` is the developer queue and operator control panel.

The Step Functions input contains only the train ID. Durable state remains in
MySQL, so worker replacement, Lambda timeout, duplicate schedules, and delayed
GitHub responses do not require an in-memory continuation.

The orchestrator stack is deployed once, in the production AWS region. It owns
both staging and production lanes; a second staging-region scheduler must not
be deployed against the same ledger.

## Release ledger

The additive migration creates:

| Table                            | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `release_ready_deployments`      | Immutable candidate identity and lifecycle           |
| `release_candidate_dependencies` | Cross-repository candidate DAG                       |
| `release_trains`                 | Frozen staging or production trains                  |
| `release_train_items`            | Ordered candidates in a train                        |
| `release_train_operations`       | Exactly correlated external effects                  |
| `release_train_evidence`         | SHA, artifact, workflow, E2E, and deploy evidence    |
| `release_deployment_lanes`       | Global orchestration, staging, and production leases |
| `release_bus_controls`           | Durable `ALL`, `STAGING`, and `PRODUCTION` pauses    |
| `release_train_events`           | Append-only audit history                            |

There are no database foreign keys or database enum constraints. Application
code enforces transitions and optimistic row versions. The release tables are
isolated from product-domain transactions even though they use the same DB.

## APIs

All endpoints are under `/deploy`:

- `POST /release-candidates/ready`
- `POST /release-candidates/:id/cancel`
- `GET /release-candidates`
- `GET /release-trains`
- `GET /release-trains/:id`
- `GET /release-bus/controls`
- `POST /release-bus/pause`
- `POST /release-bus/resume`
- `POST /release-bus/authorize`
- `POST /release-bus/report-progress`
- `POST /release-bus/authorize-break-glass`
- `POST /github/webhook`

Developer readiness uses the developer's GitHub token only to establish
identity, repository write permission, current branch SHA, open source PR, and
dependency heads. Tokens are never persisted.

Workflow authorization uses a separate shared workflow credential and then
matches train ID, revision-derived operation key, workflow run ID, repository,
environment, service, expected SHA, artifact run ID, artifact digest, and live
lane ownership. The first matching execution and digest are bound atomically;
a different run or digest cannot claim the same operation.

`report-progress` is bound to the exact authorized train, operation key, and
workflow run. It accepts only bounded structured gate fields: stage outcomes,
failing Jest suite/test identities, and the strict base-canary aggregate
summary used by deterministic exact-SHA evidence. It never accepts or returns
raw logs, stack traces, workflow credentials, GitHub App credentials, or lease
tokens. An identical terminal `complete` report is idempotent and creates no
second write or event; a different terminal report for the same operation and
run is rejected.

`GET /release-trains` retains the legacy train list and adds `active_train`.
`GET /release-trains/:id` retains `train` and `items` and adds `overview`.
The overview contains the explicit phase/state, elapsed time, structured wait,
current operation, external run ID and allowlisted URL, active/failed job and
step, last workflow progress, worker heartbeat, safe lease ownership and
timing, last meaningful event, included candidates, bounded timeline, and
actionable incident summary. This is the control panel data contract.

Webhook signatures use the raw request body and HMAC-SHA256. The minute
reconciler independently checks queued branch heads, so webhook loss affects
latency rather than correctness.

## GitHub workflows

Both repositories contain release-bus workflows for:

- temporary release-branch composition;
- immutable preflight and packaging;
- deterministic candidate isolation with optional read-only Codex diagnostics;
- post-production `main` to `1a-staging` synchronization.

Frontend Release Bus validation is centralized in
`scripts/release-bus-frontend-gate.sh`. Preflight and candidate isolation call
that gate instead of maintaining independent Jest command lines. Ordinary
frontend PR CI runs the gate contract whenever the gate or any Release Bus
workflow changes, preventing an invalid argument-forwarding change from being
merged unnoticed.

Before composing a train that contains frontend work, the worker dispatches
`release-bus-base-canary.yml` against the train's exact recorded frontend base
SHA. The canary runs lint, typecheck, the complete Jest suite, and a production
build. Failure requeues the train's candidates, pauses the lane, and records the
exact Actions run as operator evidence; it never attributes the base failure to
a candidate. Backend-only trains skip this frontend canary.

The frontend base canary has three independently selectable execution modes:

| GitHub Actions variable          | Allowed values                | Safe default |
| -------------------------------- | ----------------------------- | ------------ |
| `RELEASE_BUS_FRONTEND_GATE_MODE` | `legacy`, `shadow`, `sharded` | `legacy`     |
| `FRONTEND_GATE_SHARD_COUNT`      | `1`, `2`, `4`                 | `1`          |

`legacy` keeps the original serial gate authoritative. `shadow` runs that
serial gate and the parallel lint, typecheck, production-build, inventory, and
Jest shard jobs against the same SHA, but only the serial outcome controls the
train. `sharded` makes the parallel aggregate authoritative. Jest continues to
use `--runInBand --bail=0` inside every deterministic Jest `--shard=N/M`; the
matrix has `fail-fast: false` and no automatic retry. Returning to
`legacy`/one shard is the no-code rollback.

Each validation job detaches the exact base SHA, installs frozen dependencies
through `./bin/6529`, and proves that source files were not mutated. Gate and
reporting tooling is copied to runner temporary storage from the exact workflow
commit, so a workflow dispatched from pinned `main` can validate an older base
without substituting that base's control-plane policy. The fingerprint covers
the workflow and this tooling at the workflow SHA, plus the Jest configuration,
package manager, lockfile, and approved runner at the base SHA. Changing any
covered policy invalidates older evidence.

Every shard uploads bounded JSON counts, timing, its planned manifest, its
executed-file manifest, exact shard coordinates, and failing suite/test
identities. The fail-closed aggregate requires every selected job to succeed,
requires every expected Jest file in exactly one shard, compares each shard's
plan to execution, and rejects missing, duplicate, unexpected, malformed,
cancelled, or failed evidence. Artifacts are retained for 14 days and never
contain raw logs or failure messages. Dependency-store caching is intentionally
deferred: the measured frozen install is small compared with Jest, and neither
`node_modules` nor validation output may be cached as gate evidence.

The pre-acceleration reference run was
[frontend Actions run 29816499825](https://github.com/6529-Collections/6529seize-frontend/actions/runs/29816499825):

| Phase                    | Reference result                        |
| ------------------------ | --------------------------------------- |
| frozen install           | about 28 seconds                        |
| lint                     | about 181 seconds                       |
| typecheck                | about 57 seconds                        |
| Jest                     | 2,033 suites / 12,025 tests / 1,511 sec |
| production build         | about 452 seconds                       |
| complete serial workflow | about 38.3 minutes                      |

Exact-SHA evidence reuse is separately controlled on the backend worker:

| Worker setting                            | Safe default |
| ----------------------------------------- | ------------ |
| `RELEASE_BUS_BASE_EVIDENCE_REUSE_SHADOW`  | `false`      |
| `RELEASE_BUS_BASE_EVIDENCE_REUSE`         | `false`      |
| `RELEASE_BUS_BASE_EVIDENCE_MAX_AGE_HOURS` | `24`         |

An operator may also select **Fresh base canary required** on a frontend
candidate. A reusable success must match repository, exact base SHA,
`orchestration` environment, complete fingerprint and workflow provenance,
Node/package-manager contract, structured artifact digest, successful shard
coordinates/counts, and effective expiry. The newest result for that exact
contract wins, so a newer failure blocks an older success. Reuse never covers
candidate composition, preflight, deployment, or E2E. A hit writes durable
`BASE_CANARY_EVIDENCE_REUSED` evidence with the source train, run, artifact,
creation, and expiry, then advances within that worker cycle. Shadow lookup
writes `BASE_CANARY_EVIDENCE_WOULD_REUSE` but still dispatches a fresh gate.

Rollout is ordered and reversible: deploy the additive candidate column first;
deploy the API/worker with both reuse flags false; merge the frontend workflow
with `legacy`/one shard; collect serial-versus-sharded equivalence in `shadow`;
promote `sharded` only after exact outcomes and all counts agree; enable reuse
shadow and inspect real decisions; then enable reuse with the 24-hour TTL.
Disable reuse independently or return the frontend to `legacy`/one shard before
considering a code rollback.

Frontend workflows report lint, typecheck, unit-test, and build outcomes as
separate structured stages. Jest JSON is reduced to bounded repository-relative
suite names and exact failing test names; failure messages and raw output are
discarded. The reporting path and every release decision remain deterministic
when `RELEASE_BUS_CODEX_ENABLED` is absent or false and when no OpenAI
credential exists.

Backend deployment continues through the generated per-service workflow, now
with exact SHA, preflight run, checksum, operation, and authorization gates.
The deploy registry supplies adapters, environments, regions, verification
targets, default dependencies, and rollback capability.

Frontend has dedicated bus workflows for immutable staging and production
deployment, plus production-safe read-only E2E. The legacy staging deploy and
staging E2E workflows recognize release-bus marker commits and do not duplicate
an already completed bus deployment.

Bus deployment workflows never build again after authorization. They download
the artifact from the exact preflight run, verify its manifest and checksums,
compute the package digest, bind that digest at the API gate, deploy, and verify
the live version.

## Concurrency and retry safety

- Lambda reserved concurrency is `1` for starter, worker, and cleaner.
- DB leases enforce one global train, one staging mutation, and one production
  mutation even if Lambda concurrency settings change.
- A train contains at most 20 candidates by default (configurable up to 50),
  which bounds isolation fan-out and workflow/API load. Later candidates stay
  queued for the next departure.
- Every branch, workflow, service deploy, merge, and synchronization has a
  deterministic operation key with train, revision, immutable identity, and
  attempt.
- A repeat call first loads its operation and reconciles GitHub. It creates a
  new external effect only when absence is proven.
- Step Functions retries transient Lambda service failures and returns to a
  wait loop after an exhausted task error, preserving the train ID.
- The starter records the deterministic execution ARN before starting Step
  Functions and reconciles terminal or missing executions. Recovery reuses the
  train's recorded worker version rather than silently switching code.
- Existing manual or bus deploy workflow runs are detected before a lane is
  acquired.
- Branch updates use expected-old-SHA, non-force fast-forward semantics.

## Train and wait semantics

The worker persists explicit train phases rather than overloading `FROZEN`:

| Phase                      | Meaning                                                 |
| -------------------------- | ------------------------------------------------------- |
| `BASE_CANARY_RUNNING`      | Exact recorded frontend base gate is active             |
| `COMPOSING`                | Immutable candidates are composing on train branches    |
| `PREFLIGHTING`             | Deterministic preflight gates/artifacts are active      |
| `ISOLATING_FAILURE`        | Bounded base/candidate/combined attribution is active   |
| `DEPLOYING_BACKEND`        | Ordered backend units are deploying                     |
| `DEPLOYING_FRONTEND`       | Immutable frontend artifact is deploying                |
| `E2E_RUNNING`              | Environment E2E/version validation is active            |
| `MERGING_PRODUCTION`       | Authorized release PR movement is active                |
| `VALIDATING_STAGING`       | Staging evidence is being committed                     |
| `VALIDATING_PRODUCTION`    | Production evidence is being committed                  |
| `SYNCING_STAGING`          | Main is synchronizing back to staging                   |
| terminal or `PAUSED` state | No generic active-operation interpretation is permitted |

Every `WAIT` result is constructed by one worker boundary and contains a
structured reason plus the current operation. Reason codes distinguish rollout
mode, shadow mode, disabled production, paused controls, an actual unavailable
lease, an external deployment, a running GitHub workflow, a running
non-workflow operation, a stalled operation, reconciliation, and a bounded
phase transition. `LEASE_UNAVAILABLE` is emitted only when the corresponding
lease guard fails, and then includes the safe owner, train ID, heartbeat, and
expiry. The lease token is never exposed.

Operation health uses the latest GitHub run/job/step timestamp when available:

| Operation family                  | Stale after no progress |
| --------------------------------- | ----------------------- |
| base canary, preflight, isolation | 60 minutes              |
| frontend deployment               | 45 minutes              |
| backend deployment, E2E           | 30 minutes              |
| composition, merge, staging sync  | 15 minutes              |

Before the threshold, a long-running active workflow is `RUNNING`, regardless
of train age. After it, the operation becomes `STALLED` with one explicit
reason: workflow reconciliation stale, workflow not discovered, or no recent
workflow progress. A workflow failure records the exact gate/job/step and the
bounded Jest suite/test report when available.

## Modes

Agents discover live mode only through the repository helper:

```bash
node ops/scripts/release-bus-status.mjs
```

It uses the authenticated `gh` token internally to call
`GET https://api.6529.io/deploy/release-bus/controls`, validates all required
states, and suppresses tokens, raw API payloads, and authentication-command
output. `RELEASE_BUS_API_URL` may override the API base only with a loopback
test server; arbitrary hosts are rejected before the helper obtains a token.
Missing or unauthenticated `gh`, network and timeout failures, HTTP errors,
malformed JSON, unknown modes, or missing controls are terminal preflight
failures. Agents do not fall back to AWS CLI or infer a route from the browser,
docs, workflows, or earlier state.

Run the helper on receipt of a release request, immediately before readiness or
manual mutation, and again before production after a significant wait. Stop if
`ALL` or the relevant lane is paused.

| Live mode    | Staging route                        | Production route                           |
| ------------ | ------------------------------------ | ------------------------------------------ |
| `OFF`        | Legacy manual; no bus candidate      | Legacy manual                              |
| `SHADOW`     | Record shadow candidate, then manual | Record shadow evidence, then manual        |
| `STAGING`    | Release Bus                          | Operator/manual; no production train       |
| `PRODUCTION` | Release Bus                          | Release Bus with the staging-validated SHA |

`RELEASE_BUS_MODE` has four values:

- `OFF`: no trains are collected.
- `SHADOW`: dependency and batching decisions are recorded, candidates are
  returned to the queue, and no GitHub writes occur. Each exact candidate is
  evaluated once per lane so the scheduler does not create the same shadow
  train every minute; production-ready candidates are shadowed before unrelated
  staging-ready candidates, matching live priority.
- `STAGING`: the bus owns normal staging; production remains manual break glass.
- `PRODUCTION`: the bus owns normal staging and production.

The readiness API enforces those boundaries:

- `OFF` rejects every readiness submission before GitHub or the ledger is
  touched.
- `SHADOW` accepts eligible shadow candidates but does not create a GitHub
  commit status.
- `STAGING` accepts staging readiness and rejects production readiness.
- `PRODUCTION` accepts both staging and production readiness.
- Cancelling a candidate that already has a `Release Bus` commit status
  publishes the terminal status `release readiness cancelled`, including when
  a rollout mode was reduced after the original submission. Shadow-only
  candidates do not gain a status when cancelled.

AWS `RELEASE_BUS_MODE` controls runtime ownership and API readiness acceptance.
GitHub `RELEASE_BUS_ENFORCEMENT` is separate: exact `true` in a repository turns
legacy manual deployments into operator-only audited break glass. Agents inspect
the live Actions variable in every repository selected for a manual route.
`OFF` or `SHADOW` with enforcement enabled is a rollout mismatch and blocks the
release until an operator reconciles configuration. Enable enforcement only
after the corresponding bus mode is healthy.

## Required external setup

The code can be merged and deployed with mode `OFF` before these values exist.
Before shadow or live use, create and install the GitHub App with:

- metadata read;
- contents read/write;
- actions read/write;
- pull requests read/write;
- checks and commit statuses read/write;
- deployments read/write;
- issues write;
- organization members read, for operator-team checks.

Add the App as the repository-ruleset bypass actor. Protect `main` and
`1a-staging`; permit normal writes only from the App, and permit named operator
break glass according to organization policy.

AWS application secrets/configuration:

- `RELEASE_BUS_GITHUB_APP_ID`
- `RELEASE_BUS_GITHUB_INSTALLATION_ID`
- `RELEASE_BUS_GITHUB_PRIVATE_KEY`
- `RELEASE_BUS_GITHUB_WEBHOOK_SECRET`
- `RELEASE_BUS_WORKFLOW_AUTH_TOKEN`
- optional `RELEASE_BUS_GITHUB_ORG`, `RELEASE_BUS_OPERATOR_TEAM`, and
  `RELEASE_BUS_UI_URL` for commit-status links

The AWS and GitHub copies of `RELEASE_BUS_WORKFLOW_AUTH_TOKEN` must contain the
same high-entropy value. Set `RELEASE_BUS_MODE` in AWS configuration only when
advancing the rollout mode; it defaults to `OFF`.

GitHub repository variables/secrets in both repositories:

- variable `RELEASE_BUS_API_URL`
- variable `RELEASE_BUS_GITHUB_APP_ID`
- variable `RELEASE_BUS_GITHUB_APP_BOT_LOGIN`
- optional variable `RELEASE_BUS_CODEX_ENABLED`; it must equal `true` to run
  Codex and defaults to disabled when absent
- secret `RELEASE_BUS_GITHUB_PRIVATE_KEY`
- secret `RELEASE_BUS_WORKFLOW_AUTH_TOKEN`
- secret `OPENAI_API_KEY` only when `RELEASE_BUS_CODEX_ENABLED=true`
- the existing AWS, staging, build, and E2E secrets used by current workflows

Frontend bus deployment additionally needs its existing staging host, S3,
Elastic Beanstalk, CloudFront, build, and staging-auth values. Never paste
private keys or workflow credentials into chat or committed files.

## Zero-downtime rollout

1. Merge the backward-compatible workflows and API code.
2. Deploy the additive migration through `dbMigrationsLoop` before API or bus
   code reads the tables.
3. Deploy `api`.
4. Deploy `releaseBus` with mode `OFF`.
5. Install the GitHub App, webhook, secrets, operator team, and rulesets.
6. Enable `SHADOW` and compare recorded trains with real manual releases.
7. Enable `STAGING` and let the bus own staging while enforcement remains off.
8. After the chosen staging soak threshold, set repository enforcement true
   and retain the operator break-glass path.
9. Enable production shadow comparison.
10. After the separately chosen production go-live threshold, enable
    `PRODUCTION`, then production enforcement.

Gate enforcement is last. Existing deployment workflows remain usable while
the bus is `OFF` or in its initial shadow rollout.

When rolling out the frontend base-canary control specifically, merge its
workflow and shared gate into both frontend `main` and `1a-staging` before
deploying the worker that dispatches it. This ensures every recorded frontend
base and temporary train branch contains the canonical gate. Deploy the backend
`api` next, then `releaseBus`; resume a paused lane only after both deployments
are verified.

## Operations and recovery

- Pause/resume at `/deploy/ui/bus`; every change requires a reason and is
  recorded in `release_train_events`.
- Controls show the current reason and actor. Trusted frontend/backend GitHub
  Actions run URLs embedded in an automatic pause are rendered as direct
  failure-evidence links.
- A paused train heartbeats owned leases but does not start the next
  irreversible operation.
- A missed workflow response remains `AMBIGUOUS` until exact-run reconciliation
  proves its state.
- The incident card distinguishes `PRE_EXISTING_BASE`,
  `DETERMINISTIC_CANDIDATE`, and train/environment failures. A pre-existing
  base failure returns every candidate, quarantines none, applies
  `BASE_FAILURE_NO_CANDIDATE_BLAMED`, pauses the lane, and records the exact
  recovery recommendation. Candidate quarantine is allowed only after
  deterministic isolation proves the candidate-owned failure.
- Do not treat a healthy long-running GitHub workflow as a lease incident. Open
  its direct run link and inspect the reported active job/step. Retry only
  after a terminal result or deterministic stale classification.
- Expired leases can be acquired only after the active worker and external-run
  checks no longer show an owner.
- Production failure pauses production and blocks later trains. Restore a
  known-good version through a declared adapter or audited break glass, verify
  health, then resume explicitly.
- Temporary branches are retained for seven days by default and then cleaned.

CloudWatch publishes queue depth, oldest-ready age, holds, quarantines, active
train age, train duration, and train failures. The infrastructure creates
alarms for starter/worker errors, state-machine failures, trains older than two
hours, and production train failure. Route those alarms to the existing
operations notification path during infrastructure setup.

## Deliberate limits

- Generic traffic-split canaries are not implemented.
- Automatic rollback defaults to disabled for every service until an adapter
  and validation procedure are explicitly declared in the deploy registry.
- Codex cannot authorize ejection, merge, deployment, or rollback.
- The bus remains functional without Codex credentials. A composition conflict
  then publishes the conflict-free prefix (possibly containing zero
  candidates), quarantines its first omitted candidate, requeues the others,
  and relies on deterministic isolation logs without an AI summary.
- The bus does not publish release notes.
- The existing deployment manifest CLI and schema remain useful evidence
  tooling, but the database train ledger and exact operation records are the
  automation source of truth.
