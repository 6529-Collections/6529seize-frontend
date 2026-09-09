# Production build and verification workflows

`Web Deploy - PROD` calls the reusable production builder and verifier within
one GitHub Actions run, then deploys the verified bytes and runs Production
E2E. Developers dispatch only `build-upload-deploy-prod.yml` on `main`.

## Build and verify

- `production-build-artifact.yml` receives the target commit selected by the
  parent workflow. It proves protected-main ancestry, builds the production
  profile, and publishes an artifact bound to source, workflow, run, attempt,
  package checksum, and GitHub artifact identity.
- `production-artifact-verifier.yml` receives the exact builder outputs. On a
  separate runner, it checks GitHub artifact metadata, downloaded bytes,
  manifest, archive safety, source identity, and package checksum. It has no
  production deployment credentials.
- The deploy job independently verifies the downloaded package and requires
  builder/verifier checksums to agree before using AWS credentials. It then
  checks Elastic Beanstalk readiness and the served version.
- `production-e2e.yml` receives the deployed commit and parent run ID and runs
  the existing read-only validation automatically.

The `production-deployment-v1` manifest and `artifact-portability.v1` report
identify environment-bound production bytes. The report does not authorize
reusing staging bytes in production. Source and digest checks run inside the
workflows; operators do not maintain a separate deployment baseline.

## Recovery

Inspect the failed parent job and its artifacts. Rerun only when the source and
failure diagnosis make that appropriate; a successful deploy with failed E2E
remains unvalidated. An explicit E2E recovery run on `main` takes the original
`automatic_deploy_run_id` and verifies that deployment is still live.

See [Deployment](deployment.md) for merges, dispatch, service ordering, and
rollback, and [artifact portability](artifact-portability-migration.md) for the
boundary on future package reuse.
