# Deployment Bus Automation

Status: first automation slice. The deployment bus process remains defined in
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
