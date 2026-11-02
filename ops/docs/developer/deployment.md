# Deployment

Agents and developers deploy with ordinary merges and the repository's GitHub
Actions workflows. Use the phase authorized by the user; a staging request does
not authorize production.

Frontend-only, backend-only, and coupled releases use the direct workflows below
without submitting a Coordinator request or waiting for its recording workflow.
Keep existing `.release-coordinator/` run and outbox records as historical evidence.

| Target     | Frontend                                                                       | Backend                                                                                                         |
| ---------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Staging    | Merge into `1a-staging` and push; `Web Deploy - STAGING` starts automatically. | Merge into `1a-staging`, then dispatch `Deploy a service` for each required service with `environment=staging`. |
| Production | Merge into `main`, then dispatch `Web Deploy - PROD`.                          | Merge into `main`, then dispatch `Deploy a service` for each required service with `environment=prod`.          |

Frontend staging retains its existing `ops/**`-only push exclusion. Dispatch
`deploy-staging.yml` on `1a-staging` when an authorized ops-only change needs an
actual deployment.

The staging build first verifies that the committed help artifacts match the
production publication profile. It then generates the staging profile, including
staging-only help records, and verifies that those generated files remain unchanged
through packaging. Staging-generated help data does not belong in the production
source snapshot.

### Shared staging queue

Frontend staging serializes whole deployment runs with `staging-deploy` and
`cancel-in-progress: false`. An active run finishes its pinned source and verified
artifact even if a newer `1a-staging` push queues during its build. The server
fetches complete history when its checkout is shallow, requires that source to
remain in staging history, prepares the run's exact SHA in a temporary detached
worktree, and retains artifact checksums and exact local and HTTP version checks.
It does not substitute the latest branch head or rebuild on the server.

Under the instance deployment lock, the healthy running app's SHA must be an
ancestor of, or equal to, the candidate SHA. Older or divergent reruns, unavailable
history, and an unhealthy or unknown running version fail before activation.
The live checkout remains unchanged, including on rejection, so a legacy PM2
restart or rollback continues to use its original files. The temporary source
worktree is removed after the deployment attempt; the immutable app release
remains independent of it. A fresh host with no existing app can deploy normally.
Intentional rollbacks use a new reviewed revert commit through the normal
workflow; automatic recovery to the previous healthy runtime after failed
activation remains unchanged.

The default queue retains one pending run. A later push can replace that pending
run while preserving the active run, so shared staging pushes must preserve all
previous integration changes. Separate staging E2E can overlap a later deployment
and does not block the deployment queue.

## AWS deployment credentials

Frontend deployment jobs use GitHub OIDC and separate scoped IAM roles. Set
`AWS_DEPLOY_ROLE_ARN` as an environment variable in each existing GitHub
environment: `staging` accepts only `1a-staging`, and `production` accepts only
`main`. Preserve their application configuration secrets. The deployment jobs
validate the role ARN, check the assumed account, and require successful
authentication; they have no static-key fallback. Build and verification jobs
receive no AWS deployment credentials or OIDC token permission.

The optional delegation-docs CDN publisher uses its own `delegation-docs`
environment, restricted to `main`, with a separate `AWS_DEPLOY_ROLE_ARN` and
OIDC subject. Its role accesses only `6529bucket/delegation-content/` in
`eu-west-1`. A dry run verifies AWS authentication and read-only CDN access,
then builds a receipt without publishing content. IPFS credentials are exposed
only to the publishing step. See [publisher permissions](../../iam/frontend-delegation-docs/README.md).

Sessions last 90 minutes to cover the 75-minute deployment job timeout and
staging's artifact download window. Their names include the GitHub run ID:
`frontend-staging-<run ID>` and `frontend-production-<run ID>`.
Staging's signed artifact URL is capped by STS expiry. Authentication starts
inside the 75-minute deployment job, so its 90-minute session outlasts that
job's full download/deploy window by at least 15 minutes.

Staging permissions cover its artifact prefix in `seize-web` in `us-east-1`
and commands on its existing SSM-managed server in `eu-west-1`. Production
permissions cover its versioned artifact prefix, the existing Elastic Beanstalk
environment and deployment resources, and its announcement distribution.
IAM roles are global. Infrastructure or resource replacements require an
administrative policy review; deployment roles cannot edit their own policies.

See the [staging IAM runbook](../../iam/frontend-staging/README.md) and
[production IAM runbook](../../iam/frontend-production/README.md) for exact
policies, trust, validation, and runtime permission boundaries.

Every frontend build resolves, verifies, and packages one complete Network
Museum publication. A missing, partial, or invalid publication fails the build
instead of producing an artifact that would make visitor requests wait on the
source repository. The build retries bounded transient source failures before
failing. The build output records the exact accepted publication commit and
catalog identity; compare that evidence between staging and production when the
Museum source changes during a release.

## Standalone connection timeout

`Procfile` sets `KEEP_ALIVE_TIMEOUT=65000` for the generated Next.js standalone
server. Staging uses the same value in the PM2 environment generated by
`ops/scripts/deploy-staging-artifact.sh`, because PM2 does not execute `Procfile`.
The production load balancer targets Node's port 3001 directly and has a
60-second idle timeout, so Node must keep idle connections open longer. Otherwise the
load balancer can reuse a connection Node has already closed and return a 502.
Keep this relationship intact if the target port or load-balancer timeout changes;
an installed nginx proxy does not protect connections that bypass it.

See [AWS connection-timeout guidance](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html#connection-idle-timeout).

## Standalone threadpool size

`Procfile` also sets `UV_THREADPOOL_SIZE=16` for the standalone server. The
staging PM2 environment generated by `ops/scripts/deploy-staging-artifact.sh`
and `scripts/start-standalone.cjs` use the same value. Node's default pool has
four threads, shared by DNS lookups, filesystem reads, compression, crypto and
the `sharp` image transforms behind Next.js image optimization, so a few slow
operations can queue unrelated requests. The variable must be present when the
process starts, so it lives in the launch configuration rather than in
application code. Keep the three launch paths in step when changing it.

## Staging crawler cards

Open Graph and crawler cards on staging intentionally require the visitor's
staging access cookie, so they do not render without it. The deploy does not
give the staging server its own access key: `/api` routes bypass the staging
access gate, so a server-held key would let anyone without staging access render
pre-release data through `/api/og-metadata/*`.

## Order and completion

- Fetch shared refs before merging; preserve other developers' staging changes
  and resolve conflicts normally. Never force-push a shared branch.
- Read backend `src/config/deploy-services.json` and the change to select the
  required services and dependency order. Dispatch backend services one at a
  time, wait for success, then continue in the same task.
- Deploy backend dependencies before merging/deploying dependent frontend
  changes in each environment. A schema/API change commonly needs
  `dbMigrationsLoop` before `api`, then dependent frontend changes; queues and
  consumers may need their own earlier steps.
- Keep CI, artifact integrity, deployed-version checks, and health checks.
  Successful frontend deployments automatically trigger separate E2E workflows.
  Deployment is complete when build, artifact, live-version, and health checks
  pass. E2E reports separately and does not gate merges, deployments, promotion,
  or release completion. Unrelated PR E2E (for example, Museum tests for a change
  outside Museum) must not delay a release; keep relevant CI checks and report
  the separate E2E status accurately.
  Automatic dispatch supplies the deployment run ID. To rerun E2E manually, select
  `main` and supply that successful deployment run ID; no SHA input is needed.
- Coordinate potentially conflicting deployments through GitHub run visibility;
  existing concurrency is repository-scoped. Do not cancel another developer's
  run. Wait for that work to finish when the environment would conflict.

## Workflow dispatch examples

Production E2E also runs a daily read-only canary at 05:30 UTC. It resolves the
live production SHA against successful GitHub production deployment records,
verifies the selected run's canonical deploy job and current live version, and checks out that exact source before
running the manifest's production `cron` packs. It shares the post-deploy E2E
concurrency group, installation steps, publication provenance, and artifacts.
The canary runs the full cron set regardless of the previous deployment's change
scope; only failures notify the shared CI wave receiver.

To rerun that canary, dispatch Production E2E on `main` with `scope=canary` and
the successful deployment run ID in `automatic_deploy_run_id`. The default
`post-deploy` scope preserves ordinary deployment validation. Both modes reject
a selected deployment that is no longer live.

The production source resolver retries transient GitHub API transport errors
and HTTP 5xx responses immediately, up to three attempts per read. Authentication
errors and invalid deployment provenance fail immediately. Successful responses
must still satisfy the deploy-run, canonical-job, and live-version checks.

Scheduled discovery reads the uncached live version first. It examines at most
three pages of SHA-matching production deployment records and, if they omit the
live deployment, at most three pages of SHA-bound workflow history. Every
candidate must match the live SHA; old history never determines the expected
version. Unsettled versions and missing or invalid provenance remain failures.
The job preserves source discovery, run/job provenance, and live-version evidence
even when browser checks cannot start. Canary alerts distinguish setup failures
from browser-test failures.

Wave browser coverage waits for a rendered data row after the sidebar shell
mounts. Museum exact-source coverage allows a bounded server-side background
refresh to settle through new documents, then retains the fresh-publication and
immutable source-commit assertions. Persistent stale content, HTTP 5xx, missing
data, and wrong source identities still fail validation.

Run these only after the corresponding merge and within the authorized scope.
Select the service needed by the change; `api` below is an example.

```bash
gh workflow run deploy.yml -R 6529-Collections/6529seize-backend \
  --ref 1a-staging -f environment=staging -f service=api

gh workflow run build-upload-deploy-prod.yml \
  -R 6529-Collections/6529seize-frontend --ref main
```

Find the new run by workflow, branch, service, and commit; follow that run to
completion. The workflows resolve and verify the source commit and artifact
identity automatically.

Frontend production resolves the uploaded artifact through a reusable workflow
that receives no build secrets. It reads GitHub's artifact metadata and binds it
to the successful builder attempt, including when only failed jobs are rerun.
This avoids secret masking of ordinary build outputs while preserving the
independent archive, manifest, package digest, and deployed-version checks.

Backend production also carries release-note inputs:

- `release_pull_request`: merged PR represented by the deployment;
- `release_group_services`: the complete comma-separated service set, unchanged
  across that PR's sequential deployments;
- `release_note_publish`: `false` until the final service, then `true`;
- `release_note_groups`: per-PR groups when several PRs share the deployment;
- `release_note_opt_out=true`: only when the user explicitly requests that the deployment not
  create a release note, with PR/group metadata omitted and publish left false.

The autonomous bot owns release-note writing and publication. Preserve its
metadata and final signal. Per-deploy frontend and backend notes post to the
`Deploys · Production` wave; `6529 Releases` receives one AI-written daily
digest plus individual Desktop and mobile app release notes. CI wave
notifications are best effort and use deploy run IDs to correlate E2E replies.

## Sitemap generation

The `postbuild` step (`next-sitemap.build.cjs`) builds the sitemap from live
public API feeds. Each feed gets up to three attempts with jittered backoff. If a
feed is still unavailable or fails its minimum-size floor, production deploy
builds (GitHub Actions with `VERSION` set to the exact commit) fail rather than
publish a truncated sitemap; rerun the build once the API is healthy. Pull
request and local builds skip only that section, print a loud warning (and a
GitHub annotation in CI), and still emit the static pages. The optional profile
sample never fails a build. Set `SITEMAP_FAILURE_POLICY=fail` or `fallback` to
override the detection.

## Failure and rollback

Inspect the failing job and logs. Fix attributable failures on the development
branch, merge the fix into the authorized target, and repeat only the required
deployments. Keep dependent frontend changes waiting for successful backend
dependencies. Report deployment health and E2E as separate outcomes. Investigate
known attributable regressions, but do not wait for E2E or block releases on
unrelated E2E failures.

Use a reviewed revert or compatible known-good source through the same ordinary
workflow for rollback; retain shared history and account for database/API
compatibility. Do not drop schema as part of a routine application rollback.
Report the run links, affected services, health/E2E outcomes, and remaining
failures. Preserve useful logs and artifact evidence without exposing secrets.

See [CI wave notifications](ci-wave-deploy-validation-notifications.md), [package commands](pnpm-and-socket-firewall.md), and the [deployment skill](../../skills/deploy-6529/SKILL.md).
