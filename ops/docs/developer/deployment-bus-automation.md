# Deployment Bus Automation

Status: deployment-bus automation slices. The deployment bus process remains defined in
`ops/docs/developer/deployment-bus-process.md`; this page documents the durable
automation primitives added around the current staging and production workflows.

## What This Automates

This PR does not move the bus automatically. It adds the release ledger that a
safe bus needs before queue automation can make decisions:

- deployment bus manifest schema at `ops/deployment-bus/manifest.v1.schema.json`
- repo-native CLI at `ops/scripts/deployment-bus.cjs`
- GitHub Deployment records for staging and production deploy workflows
- Deployment status heartbeats while SSM or Elastic Beanstalk waits are running
- manifest artifacts retained from deploy workflow runs
- release report artifacts retained beside the manifest
- standard deployed-environment validation pack names and commands
- auto-hold evaluation for missing or failed required evidence
- post-deploy watch evidence in the release report
- explicit canary-readiness fields that say what rollout capability exists
- deployed HTTP `/api/version` checks that prove the live app serves the
  deployed SHA before the workflow marks a deployment verified
- production workflow check that fails if `origin/main` advances during the
  build before Elastic Beanstalk is updated
- deployed-staging Playwright mode through `PLAYWRIGHT_BASE_URL` and
  `PLAYWRIGHT_SKIP_WEB_SERVER`

The next automation PR can use these records for queue collection, PR comments,
label transitions, dashboards, and stricter production preflight enforcement.

## Manifest Contract

Generate a manifest with:

```bash
6529 run deployment-bus -- create-manifest \
  --environment staging \
  --staging-deploy-sha <1a-staging-sha> \
  --production-candidate-sha <origin-main-sha> \
  --production-eligible true \
  --release-captain <owner> \
  --output deployment-bus-manifest.json
```

Validate and summarize:

```bash
6529 run deployment-bus -- validate-manifest --file deployment-bus-manifest.json
6529 run deployment-bus -- summarize-manifest --file deployment-bus-manifest.json
6529 run deployment-bus -- record-validation-check \
  --file deployment-bus-manifest.json \
  --pack playwright:core-smoke \
  --status passed \
  --surfaces web:desktop-chromium,web:mobile-chromium \
  --artifact-uri s3://6529-artifacts/frontend/<release-id>/core-smoke.json \
  --redaction-status verified-redacted \
  --artifact-sha256 <sha256> \
  --retention-policy standard-90-days
6529 run deployment-bus -- record-post-deploy-watch \
  --file deployment-bus-manifest.json \
  --status passed \
  --observed-duration-minutes 30 \
  --checkpoint version-match \
  --checkpoint-status passed \
  --evidence https://github.com/6529-Collections/6529seize-frontend/actions/runs/<run-id> \
  --notes "API version, route smoke, and static asset checks passed"
6529 run deployment-bus -- release-report --file deployment-bus-manifest.json --output deployment-release-report.md
```

The manifest separates:

- `shas.staging_deploy_sha`: the actual `1a-staging` SHA deployed to staging
- `shas.production_candidate_sha`: the `origin/main` SHA that staging is meant
  to prove for production
- `production_eligible`: whether this staging deployment satisfies the
  production same-SHA gate

If staging does not contain the current `origin/main` SHA, the workflow still
records the deployment, but the manifest is exploratory and not production
eligible.

Manifest creation is intentionally a hard deploy gate. If the workflow cannot
create and validate the manifest, it stops before SSM, S3, or Elastic Beanstalk
mutation. The deployment lane should not move when its release ledger cannot be
written.

## Standard Validation Packs

The deployment manifest now records the standard frontend deployed-environment
packs in `validation.required_packs` and expands them in
`validation.pack_plan`.

`playwright:core-smoke` is the fast route smoke pack. `playwright:surface-matrix`
is the broader route/navigation workflow pack. `playwright:production-readonly`
is a known production-only aggregate pack that release captains can opt into
when recording full production-safe read-only evidence; it is not in the
default required pack set until durable artifact upload and recording are
automated.

| Pack                             | Staging command                                                                                                        | Production command                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `playwright:core-smoke`          | `seize run test:e2e:staging:smoke`                                                                                     | `PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:smoke:surface-matrix`     |
| `playwright:surface-matrix`      | `seize run test:e2e:staging`                                                                                           | `PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:surface-matrix`           |
| `playwright:wcag-i18n`           | `PLAYWRIGHT_BASE_URL=https://staging.6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix` | `PLAYWRIGHT_BASE_URL=https://6529.io PLAYWRIGHT_SKIP_WEB_SERVER=1 seize run test:e2e:wcag-i18n:surface-matrix` |
| `playwright:production-readonly` | production-only                                                                                                        | `seize run test:e2e:production:readonly`                                                                       |

The default required standard pack plan records `web:desktop-chromium` and
`web:mobile-chromium` as the covered deployed web surfaces. The production
read-only aggregate records `web:desktop-chromium` only because production
scripts intentionally run production-safe public checks on desktop Chromium.
Firefox, WebKit, Capacitor simulation, and Electron simulation remain optional
train/nightly or targeted validation lanes until they are stable enough to make
them required deployment evidence. Browser simulation must not be described as
real native or real Electron shell coverage.

For standard required packs, release readiness requires the latest passing
check to record the pack-plan command and every required pack-plan surface.
Equivalent but differently spelled commands should be recorded as custom or
release-captain exception evidence, not as a passed standard pack.

## Release Reports And Auto-Hold

Deploy workflows now update `deployment-bus-manifest.json` to a terminal deploy
status before artifact upload and write `deployment-release-report.md` beside
it. The report includes:

- exact staging and production candidate SHAs;
- release captain and environment URL;
- required validation packs and their commands;
- recorded validation checks and artifact pointers;
- post-deploy watch status, duration, checkpoints, and evidence links;
- current canary capability and future traffic-split prerequisites;
- auto-hold findings;
- included PRs and artifact policy.

The report status is `hold` when required validation evidence has not been
recorded yet. A hold does not mean the deploy failed. It means production
promotion or public release notes still need the missing deployed-environment
evidence or a recorded release-captain exception.

`record-validation-check` appends a timestamped result to
`validation.checks`. Use it after a required pack finishes so the next release
report can distinguish unresolved findings from a fixed rerun. The latest
recorded result for each required pack is authoritative for pack readiness; a
failed run can be cleared by a later passing rerun with retained evidence.

For release readiness, each required pack's latest passing check needs its own
approved durable artifact pointer. An unrelated check's artifact does not prove
the required pack. The pointer must include:

- an approved durable URI without query strings, fragments, signed URL tokens,
  local filesystem paths, or Git LFS pointers;
- `redaction_status=verified-redacted`;
- integrity metadata: `sha256`, `etag`, or `cid`;
- retention metadata: `retention_days`, `retention_until`, or
  `retention_policy`.

Current auto-hold criteria:

- any required validation pack records `failed`, `blocked`, or `timed_out`;
- a deploy-verified or terminal manifest lacks a passed check for each required
  validation pack;
- a production-eligible manifest's latest passing required-pack check lacks an
  approved durable artifact pointer with verified redaction, integrity metadata,
  and retention metadata;
- a production release manifest has not recorded a passed post-deploy watch, or
  the watch duration/checkpoints do not satisfy the manifest;
- the production candidate SHA no longer matches the staging-validated release
  set.

Durable evidence must point at approved 6529-controlled artifact storage such
as `s3://6529-artifacts/`, `https://artifacts.6529.io/`, or `ipfs://` for
intentionally public redacted provenance. Git LFS and committed generated files
are not durable release evidence stores. Do not record temporary signed URLs,
query-string credentials, fragments, local paths, or unredacted artifacts.

GitHub Actions workflow artifacts and run URLs are useful temporary evidence,
but they are not durable artifact pointers. They can appear in post-deploy watch
checkpoints and release reports; they do not satisfy the durable-artifact hold
for retained Playwright traces, screenshots, or validation outputs.

## Post-Deploy Watch And Canary Readiness

Every manifest has `post_deploy_watch` and `canary_readiness` fields.

`post_deploy_watch` records:

- whether a watch is required;
- current status: `not_started`, `in_progress`, `passed`, `failed`,
  `blocked`, or `skipped`;
- minimum and observed watch duration;
- timestamped checkpoints with evidence links;
- notes for the release captain or validation agents.

The staging workflow records a staging deploy-verification checkpoint after SSM
and deployed-SHA verification. Both deploy workflows also run a GET-only
`/api/version` check against the deployed environment and upload
`deployment-version-evidence.json` with the workflow artifacts. The production
workflow records an `eb-version-health` checkpoint after Elastic Beanstalk
health/readiness and version-label validation. Production workflow evidence
starts the watch but does not by itself complete the release-captain
post-deploy watch; production validation agents should record the final
`passed` watch after the deployed environment checks finish.

Run the same HTTP version probe locally or from a release-captain shell with:

```bash
6529 run verify:deployment-version -- \
  --base-url https://6529.io \
  --expected-version <sha> \
  --output deployment-version-evidence.json
```

For staging, provide the access code through `PLAYWRIGHT_STAGING_ACCESS_CODE` or
`STAGING_AUTH` only as an environment value. The evidence file records the
target origin, `/api/version` status, cache policy, expected version, and actual
version, but never request headers or cookies.

Production watch completion is intentionally a two-step handoff:

1. The production workflow records the automated `eb-version-health` checkpoint
   and leaves `post_deploy_watch.status` as `in_progress`.
2. The release captain or validation agent runs the production-safe smoke,
   surface-matrix, WCAG/i18n, API version, and changed-surface checks.
3. After those checks pass, the validator records the terminal watch status:

```bash
6529 run deployment-bus -- record-post-deploy-watch \
  --file deployment-bus-manifest.json \
  --status passed \
  --observed-duration-minutes 30 \
  --checkpoint release-captain-validation \
  --checkpoint-status passed \
  --evidence https://github.com/6529-Collections/6529seize-frontend/actions/runs/<run-id> \
  --notes "Production smoke, surface matrix, WCAG/i18n, and API version checks passed"
```

Use canonical evidence URLs without query strings or fragments; signed URLs and
tokenized dashboard links do not belong in deployment-bus manifests or release
reports.

If production validation fails, record `failed` or `blocked` instead and keep
the release on hold until rollback or fix-forward validation passes.

`canary_readiness` records current rollout capability. Today the frontend bus
supports auto-hold and explicit staged watch. Generic deployment traffic
splitting is not currently supported, and feature flags are app-specific rather
than a release-lane capability. The manifest records candidate/control metrics
and prerequisites so a future traffic-split canary implementation has a clear
contract instead of being inferred from prose.

## GitHub Deployment Ledger

The staging workflow creates a GitHub Deployment with:

- `environment=staging`
- `task=deploy:staging`
- `ref=<staging_deploy_sha>`
- static deployment bus pointer payload; the manifest artifact is the ledger
- status `queued`, then `in_progress`, then `success`, `failure`, or `error`

The production workflow creates a GitHub Deployment with:

- `environment=production`
- `task=deploy:production`
- `ref=<github.sha>`
- static deployment bus pointer payload; the manifest artifact is the ledger
- status `queued`, then `in_progress`, then `success`, `failure`, or `error`

Each status includes a workflow `log_url`; terminal statuses include the public
environment URL.

## Complex And Multi-Hour Deployments

Complex releases are first-class. A manifest becomes long-running when
`complexity=complex` or `lane.expected_duration_minutes` is greater than 120.
The validator then requires:

- explicit heartbeat interval and stale-after window
- progress update channels
- escalation window
- checkpoint labels
- rollback and fix-forward plans

Recommended operating model:

- heartbeat every 5-10 minutes while SSM or Elastic Beanstalk is doing active
  infrastructure work
- heartbeat every 15-30 minutes while humans validate a complex candidate
- mark a release stale when the workflow is terminal but the Deployment is not,
  no heartbeat appears after the stale window, or a superseded run tries to
  update an older candidate
- never auto-steal production; staging can be superseded only by a release
  captain with a recorded reason

The current workflows emit periodic `in_progress` Deployment statuses during
long SSM and Elastic Beanstalk wait loops. Human validation heartbeats can use:

```bash
6529 run deployment-bus -- heartbeat-manifest \
  --file deployment-bus-manifest.json \
  --status validating \
  --phase area-pack-validation \
  --message "Waves and media validation still in progress"
```

For live Deployment status updates:

```bash
6529 run deployment-bus -- github-create-status \
  --deployment-id <deployment-id> \
  --state in_progress \
  --description "Validation still in progress: media/IPFS pack"
```

## Production Preflight

Production deploys remain human-approved and main-only. The production workflow
now performs a late check after build. It fetches `origin/main`, passes the
resolved SHA into the deployment bus preflight, and aborts before the first
production mutation when the staged candidate no longer matches:

```text
origin/main must still equal github.sha before assets are uploaded and Elastic
Beanstalk is updated.
```

This catches long-build races where the workflow started from `main`, but a
newer unvalidated commit reached `origin/main` before production mutation. A
future PR can make this stricter by reading the latest successful staging
manifest artifact and requiring its `production_candidate_sha` to match
`github.sha`.

## Deployed-Staging Smoke

Run the read-only staging smoke pack without starting a local web server:

```bash
6529 run test:e2e:staging
```

The command sets:

- `PLAYWRIGHT_BASE_URL=https://staging.6529.io`
- `PLAYWRIGHT_SKIP_WEB_SERVER=1`

When the staging access gate is enabled, provide the access code through
`PLAYWRIGHT_STAGING_ACCESS_CODE` or `STAGING_AUTH`. Operators must not print or
persist it.

The Playwright config disables traces when `PLAYWRIGHT_BASE_URL` is
`https://staging.6529.io` so the access-code entry is not retained in retry
artifacts. Do not re-enable traces for staging smoke runs unless the unlock flow
has a separate redaction path.

Keep deployed-environment tests production-safe: no public posts, purchases,
wallet transfers, signer changes, destructive writes, or irreversible live
actions.

## What Remains Manual

Still manual in this slice:

- deciding the staging batch
- pushing or updating `1a-staging`
- labels and PR comments
- release dashboard
- backend service deployment order
- production approval
- production promotion
- production rollback
- release notes and wave publication

Those should build on this ledger instead of re-inferring release state from
workflow runs alone.
