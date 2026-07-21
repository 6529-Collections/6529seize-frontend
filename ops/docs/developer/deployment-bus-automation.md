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
