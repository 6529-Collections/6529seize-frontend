# Production artifact verifier

`production-artifact-verifier.yml` runs on an isolated `ubuntu-latest` runner
between the production build and deployment jobs. It uses only `actions: read`
and `contents: read`; it has no AWS deployment or build-time credentials.

## Inputs and invocation

`Web Deploy - PROD` invokes the verifier with `workflow_call` and the builder's
outputs. A separate `workflow_dispatch` is available for inspecting an exact
artifact. The inputs are:

| Input                   | Meaning                                                |
| ----------------------- | ------------------------------------------------------ |
| `target_sha`            | Production source commit.                              |
| `artifact_run_id`       | Builder's GitHub Actions run ID.                       |
| `artifact_run_attempt`  | Exact producer attempt.                                |
| `artifact_id`           | GitHub artifact ID attached to that run.               |
| `artifact_digest`       | GitHub artifact archive digest in `sha256:<hex>` form. |
| `artifact_name`         | `production-frontend-<target_sha>-<artifact_run_id>`.  |
| `artifact_workflow_sha` | Exact producer workflow revision.                      |

The verifier reads the specified run/attempt and artifact directly. It checks
repository ownership, canonical workflow identity, `main`, dispatch event,
producer revision, artifact attachment, expiration, name, and digest. A
reusable builder is part of the parent deployment run; its workflow reference
must match. The parent can still be running while the verifier executes.

## Byte and source verification

The verifier downloads by artifact ID and checks archive paths and extracted
filesystem shape with `ops/scripts/verify-production-artifact.cjs`. It rejects
unsafe paths, duplicate entries, unexpected files, symlinks, and special files.
It verifies the raw archive digest, `SHA256SUMS`, the package archive, and the
package checksum.

The `production-deployment-v1` manifest binds the production environment,
source/target commit, workflow revision, run/attempt, artifact name, and package
checksum. The verifier checks current protected-main ancestry for both the
target and the builder's recorded protected-main commit. The portability report
must bind the same production package and retain `NOT_PORTABLE` with reuse and
promotion disabled.

## Result and deployment

A successful verifier returns `package_sha256`. The parent deployment job
independently verifies its downloaded bytes and requires the builder and
verifier package checksums to agree before using AWS credentials. A failed
verifier blocks that deployment job.

These checks run automatically. Developers invoke the parent deployment
workflow once, without constructing a separate selection record. See
[Production build and verification](one-click-production-children.md) and
[Deployment](deployment.md).
