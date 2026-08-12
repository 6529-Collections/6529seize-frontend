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

After the deployment succeeds, the canonical workflow calls reusable `Staging
E2E` with that exact SHA before it releases the `staging-deploy` environment
lock. A later staging deployment therefore cannot change the environment while
automatic E2E validates it. A manual E2E recovery run acquires the same
environment lock and accepts only the run ID of a completed, successful,
canonical staging deploy job whose exact version is still live; arbitrary
source SHAs and non-`main` workflow refs are not accepted. The staging
access-code secret is exposed only to the final test step after this source
authorization succeeds. The CI-wave finalizer runs after build, deployment, and
automatic E2E: it reports success only when all three succeeded and reports
failure when any of them failed or was skipped by an upstream failure.

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
`main` and requires the selected target to remain in its history; harmless
advancement of `main` does not invalidate the frozen artifact. It also reads
the deployed production SHA and requires that SHA to be an ancestor of the
target, preventing an older version from being deployed over a newer one.
Elastic Beanstalk and the public version endpoint must both report the exact
target SHA after deployment.

After deployment and version announcement succeed, the canonical workflow
calls reusable `Production E2E` with the exact deployed SHA before releasing
the `web-deploy-prod` environment lock. A later production deployment therefore
cannot change the environment during automatic E2E. Manual production E2E
recovery also acquires that lock and accepts only a canonical run ID whose
production deploy job succeeded and whose exact version is still live. Manual
recovery must run the trusted E2E workflow from `main`. Once the verified
deployment succeeds, the deployment notifier publishes the production status
and starts release-note generation without waiting for automatic E2E. A second
notifier runs after E2E and asks the backend to attach a threaded validation
reply to those release notes. A failed validation is therefore visible as an
explicit invalid result and tags `devs6529`; it does not erase or suppress the
record of what was deployed.

## Concurrency and recovery

- Each canonical deployment holds `staging-deploy` or `web-deploy-prod` from
  build through its automatic E2E continuation.
- Automatic E2E additionally uses `staging-e2e` or `production-e2e`; manual E2E
  acquires the corresponding deployment group so it cannot overlap mutation.
- All groups use `cancel-in-progress: false`; queued work is not evidence that
  an earlier running workflow may be cancelled.
- A failed build or verifier run cannot reach deployment credentials.
- CI-wave production notifications distinguish deployment from validation:
  build/verifier/deploy failures produce a deployment failure, a successful
  deploy publishes release notes, and automatic E2E adds a threaded validated
  or invalid reply afterward.
- A production target outside current `main` history or a downgrade rejection
  requires a fresh explicit production decision; do not bypass the guard.
- A successful deploy with failed E2E is reported as deployed but unvalidated.
  Do not silently redeploy or substitute a manual E2E run for the automatic
  run's result.

The former frontend Release Bus integration is retained for historical and
restoration reference under
`ops/archive/frontend-release-bus-integration/`. Archived workflows are outside
`.github/workflows/` and cannot execute.
