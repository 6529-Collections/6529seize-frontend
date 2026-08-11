# Frontend deployment

The frontend deploys through two repository-owned, exact-SHA paths. Both keep
artifact construction and verification separate from the environment mutation,
serialize each environment with GitHub Actions concurrency, and automatically
run read-only E2E after a successful deployment.

## Staging path

`Web Deploy - STAGING` (`.github/workflows/deploy-staging.yml`) is triggered by
a push to `1a-staging`. A manual dispatch remains available for an explicitly
authorized rerun, but the workflow rejects every ref other than
`refs/heads/1a-staging`.

The workflow checks out `github.sha`, verifies that exact checkout, builds the
staging profile, packages the standalone server and static assets, records an
artifact portability inventory, writes a `staging-deployment-v1` manifest and
checksums, and uploads the exact artifact. The deploy job downloads that
run-bound artifact, verifies the manifest, package digest, portability record,
and checksums before AWS credentials are configured. Elastic Beanstalk and the
public version endpoint must both report the same exact SHA.

After success, `Staging E2E Dispatch` passes the deploy run ID to `Staging E2E`.
The E2E workflow re-reads that run, requires the canonical workflow path,
repository, branch, successful conclusion, and 40-character head SHA, then
checks out and tests that exact deployed source.

## Production path

`Web Deploy - PROD` (`.github/workflows/build-upload-deploy-prod.yml`) is a
manual `workflow_dispatch` entry point on `main`. It has no `push` trigger, so
merging or pushing to `main` cannot start a production deployment.

The workflow freezes its `github.sha`, calls `Build Production Artifact`, and
passes the returned exact run ID, attempt, artifact ID, API digest, name,
workflow SHA, and target SHA to `Verify Production Artifact`. The verifier
reads the exact GitHub run and artifact endpoints, verifies the archive digest
before extraction, enforces a closed artifact filesystem shape with no links or
special files, verifies checksums, manifest, package digest, portability
inventory, and protected-main ancestry, and exposes the verified package
digest.

The deploy job independently downloads and checks the same artifact before
obtaining AWS credentials. Immediately before mutation it fetches current
`main` and refuses to continue if the queued target is no longer its head. It
also reads the currently announced production SHA and requires that SHA to be
an ancestor of the target, preventing an older version from being deployed over
a newer one. Elastic Beanstalk and the public version endpoint must both report
the exact target SHA after deployment.

After success, `Production E2E Dispatch` passes the deploy run ID to
`Production E2E`. As in staging, the E2E workflow re-reads the exact successful
canonical deploy run and tests its exact head SHA.

## Concurrency and recovery

- Staging deployment uses the `staging-deploy` concurrency group.
- Production deployment uses `web-deploy-prod`.
- Staging and production E2E use `staging-e2e` and `production-e2e`.
- All four groups use `cancel-in-progress: false`; queued work is not evidence
  that an earlier run may be cancelled.
- A failed build or verifier run cannot reach deployment credentials.
- A stale production target or downgrade rejection requires a fresh explicit
  production decision; do not bypass the guard.
- A successful deploy with failed E2E is reported as deployed but unvalidated.
  Do not silently redeploy or substitute a manual E2E run for the automatic
  run's result.

The former frontend Release Bus integration is retained for historical and
restoration reference under
`ops/archive/frontend-release-bus-integration/`. Archived workflows are outside
`.github/workflows/` and cannot execute.
