# Production artifact verifier

`production-artifact-verifier.yml` is the read-only boundary between the exact
production build and the deployment job. It does not build, deploy, contact AWS,
or receive deployment credentials. Its permissions are limited to
`actions: read` and `contents: read`.

## Exact input contract

The production workflow passes these required values directly from the reusable
builder outputs:

| Input                   | Meaning                                                 |
| ----------------------- | ------------------------------------------------------- |
| `target_sha`            | Exact lowercase 40-character source SHA.                |
| `artifact_run_id`       | Exact workflow run that produced the artifact.          |
| `artifact_run_attempt`  | Exact attempt of that run.                              |
| `artifact_id`           | Exact GitHub Actions artifact ID.                       |
| `artifact_digest`       | GitHub's `sha256:<64-hex>` archive digest.              |
| `artifact_name`         | `production-frontend-${target_sha}-${artifact_run_id}`. |
| `artifact_workflow_sha` | Exact workflow head SHA recorded by the builder.        |

The verifier never lists candidate artifacts, chooses a newest match, or
rebuilds missing bytes. It reads the supplied run-attempt and artifact IDs from
the GitHub API and verifies repository, workflow path, event, main branch,
workflow SHA, artifact name, attachment, expiry state, and API digest.

## Archive and content checks

Before extraction, the raw artifact zip digest must equal the GitHub artifact
digest. `ops/scripts/verify-production-artifact.cjs` then rejects traversal,
absolute or backslash paths, duplicates, unexpected root files, and unexpected
deployment paths. After extraction it rejects symbolic links and special files
and permits only:

- `SHA256SUMS`;
- `manifest.json`;
- `artifact-portability.json`;
- `target/package.zip`; and
- static assets below `target/_next/static/`.

Every checksum is verified. The manifest must use
`production-deployment-v1` and bind the exact artifact name, target/source SHA,
workflow SHA, run ID, run attempt, protected-main SHA, environment, and package
digest. The portability record must bind the same source and package digest and
must remain explicitly `NOT_PORTABLE`.

The verifier reads current `refs/heads/main` and requires both the target SHA
and the builder's protected-main SHA to remain ancestors of current main. It
returns only the verified package SHA-256 to the caller.

## Deployment rechecks

The production deploy job downloads the artifact by its exact name from the
same workflow run and repeats checksum, manifest, package, and portability
verification before configuring AWS credentials. Immediately before mutation,
it also requires the target to equal current `origin/main` and requires the
currently announced production SHA to be an ancestor of the target. A failure
of any identity, digest, ancestry, or downgrade check stops deployment.
