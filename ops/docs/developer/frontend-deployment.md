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
authorization succeeds. The deploy result is posted to the staging CI wave
before automatic E2E starts. The E2E workflow then posts its existing
`WEB E2E passed` or `WEB E2E failed` result as a correlated reply.

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
and starts release-note generation before automatic E2E. The E2E workflow then
posts its existing `WEB E2E passed` or `WEB E2E failed` result to the production
CI wave, correlated to the deployment by its canonical GitHub run ID. Manual
recovery posts the same CI-wave result against the selected canonical deploy.
No validation result is attached to release notes.

The reusable staging and production E2E workflows retain one deliberately
narrow compatibility entry point for the backend Release Bus while frontend
Release Bus operation plumbing remains archived. Only a workflow dispatch by
the Release Bus GitHub App may supply a trusted deployed SHA and tracking ID.
That run verifies the SHA currently served by the environment and holds the
same deployment concurrency lock. Manual callers cannot use this entry point.

## Concurrency and recovery

- Each canonical deployment holds `staging-deploy` or `web-deploy-prod` from
  build through its automatic E2E continuation.
- Automatic E2E additionally uses `staging-e2e` or `production-e2e`; manual E2E
  acquires the corresponding deployment group so it cannot overlap mutation.
- All groups use `cancel-in-progress: false`; queued work is not evidence that
  an earlier running workflow may be cancelled.
- A failed build or verifier run cannot reach deployment credentials.
- CI-wave notifications preserve separate deploy and `web_e2e` results for
  staging and production. Automatic and manual E2E results correlate to the
  canonical deployment run ID.
- A production target outside current `main` history or a downgrade rejection
  requires a fresh explicit production decision; do not bypass the guard.
- A successful deploy with failed E2E remains recorded as deployed, followed by
  a failed E2E reply in the environment CI wave. A later canonical manual E2E
  run posts its own result rather than rewriting the automatic run.

The former frontend Release Bus integration is retained for historical and
restoration reference under
`ops/archive/frontend-release-bus-integration/`. Archived workflows are outside
`.github/workflows/` and cannot execute.
