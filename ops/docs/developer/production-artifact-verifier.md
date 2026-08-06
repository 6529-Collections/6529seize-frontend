# One-click production artifact verifier

`production-artifact-verifier.yml` is the isolated selection boundary between
the production orchestrator and a later deployment job. It does not build,
deploy, contact AWS, or require build-time secrets. The verifier job has only
`actions: read` and `contents: read` permissions and always runs on the literal
`ubuntu-latest` label.

## Orchestrator input contract

The production controller invokes this workflow as a standalone
`workflow_dispatch` child with the exact identity bundle. The reusable-workflow
(`workflow_call`) form has the same inputs for controlled integration testing.
All values are required for a verifier invocation and remain frozen for the
operation. The controller may keep the identity bundle optional before it
starts orchestration: if no verified bundle exists, it invokes the builder once
on demand and then calls this verifier with the resulting exact values. This
verifier never dispatches a builder or searches for one.

| Input                  | Contract                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target_sha`           | Lowercase 40-hex production source SHA.                                                                                                                          |
| `operation_id`         | Stable operation identity using the verifier's bounded character set.                                                                                            |
| `artifact_run_id`      | Positive GitHub Actions run ID for the exact successful builder run.                                                                                             |
| `artifact_run_attempt` | Positive attempt number for `artifact_run_id`; this is producer evidence, not a new operation.                                                                   |
| `artifact_id`          | Positive GitHub artifact ID attached to `artifact_run_id`.                                                                                                       |
| `artifact_api_digest`  | Exact `sha256:<64-hex>` digest carried by trusted staging/release-candidate evidence and compared to live artifact metadata.                                     |
| `artifact_name`        | Exactly `production-frontend-${target_sha}-${artifact_operation_id}`. The producer operation may be the current operation or an explicitly trusted reuse source. |

The verifier never lists artifacts, sorts candidates, selects the newest
matching run, or auto-queries by recency. It reads the exact run-attempt and
artifact endpoints by the supplied IDs, then requires all of the following:

- the exact attempt is from `.github/workflows/production-build-artifact.yml`,
  targets `main`, is `workflow_dispatch` or `workflow_call`, and is completed
  successfully;
- the run and head repository are this repository, the run head is the exact
  builder workflow revision, and it need not equal the frozen `target_sha`;
- the artifact ID, operation-and-target-bound name, non-expired state, attached
  run ID, source SHA, size, and `sha256:<digest>` API digest all match;
- the downloaded raw artifact archive has the exact GitHub API digest and
  size; and
- the archive member list is validated before extraction against the closed
  expected root (including traversal, absolute-path, duplicate, and
  backslash checks); the extracted artifact has no symlinks or special files,
  has exact checksummed regular-file membership, contains the required
  manifest, portability inventory, and `target/package.zip`, and passes every
  `SHA256SUMS` entry.

The manifest must be `production-prebuild-v2` and bind exactly the builder
contract fields `schema_version`, `artifact_contract`, `repository`,
`artifact_name`, `source_sha`, `target_sha`, `operation_id`, `workflow_sha`,
`protected_main_sha`, `workflow_run_id`, `run_attempt`, `environment`,
`package_sha256`, and `build_timestamp`. The manifest operation ID must match
the operation ID embedded in the exact artifact name, and `workflow_sha` must
match the exact builder run's `head_sha`. The GitHub artifact API digest is
separate evidence and is never copied into the manifest.

The verifier also reads the exact `refs/heads/main` ref and two exact GitHub
compare responses: `target_sha...current_main_sha` and
`protected_main_sha...current_main_sha`. Each compare must be `identical` or
`ahead`, have the expected base and merge-base SHA, and have no commits behind
the base. This proves that the frozen target remains in protected-main history
and that the builder's recorded protected-main point is an ancestor of the
current main descendant; unavailable or inconsistent evidence fails closed.

The run head is workflow-version evidence; it is not required to equal the
frozen target SHA. The verifier records the producer operation separately and
binds the resulting selection to the current `operation_id`, allowing only
these explicit reuse sources: an earlier attempt of the same operation, or an
exact run/attempt/artifact/digest supplied by trusted staging or release-
candidate evidence for this target SHA. A new operation never discovers or
adopts a newest matching artifact.

## Verifier outputs

After successful verification, the workflow uploads the small immutable
artifact named `one-click-production-selection-${target_sha}-a${verifier_run_attempt}`.
The attempt suffix and the selection record bind the result to the fresh
verifier attempt. It contains
only:

- `selection.json`, a canonical `production-artifact-selection-v1` record with
  the target and current-operation binding, producer operation, original
  builder run/attempt/artifact identity, GitHub artifact API digest,
  package/manifest/checksum digests, protected-main ancestry evidence, and
  verifier source/run/attempt identity;
  and
- `SHA256SUMS`, which covers `selection.json`.

`selection.json.selection_digest` is the SHA256 of the canonical selection
record excluding its `selection_digest` field. The upload action's
`artifact-digest` is a separate SHA256 digest of the GitHub selection archive.
The reusable workflow exposes both values and the exact selection artifact
run ID, artifact ID, and name as outputs:

```text
selection_artifact_run_id
selection_artifact_id
selection_artifact_name
selection_artifact_digest  # GitHub archive digest, sha256:<hex>
selection_artifact_run_attempt
selection_digest           # selection.json content digest, <hex>
```

The orchestrator must pass these exact outputs to the later fresh deploy job.
That job must fetch selection metadata by the exact selection artifact ID,
download the raw archive from the exact artifact endpoint/run, compare its
bytes to the GitHub API digest, verify `SHA256SUMS` and `selection_digest`,
and verify the target, operation, original artifact run/ID/name, original
artifact API digest, and production workflow identity before any deploy
authority is used. The helper supports this with:

```text
node ops/scripts/verify-production-artifact-selection.cjs verify-selection \
  --expected-target-sha ... \
  --expected-operation-id ... \
  --expected-artifact-run-id ... \
  --expected-artifact-run-attempt ... \
  --expected-artifact-id ... \
  --expected-artifact-name ... \
  --expected-artifact-api-digest sha256:... \
  --selection-artifact-run-id ... \
  --selection-artifact-run-attempt ... \
  --selection-artifact-id ... \
  --selection-artifact-name ... \
  --selection-artifact-metadata ... \
  --selection-run-metadata ... \
  --selection-archive ... \
  --selection-root ... \
  --repository owner/name
```

The selection is immutable evidence, not deployment authorization. A failed
metadata, digest, manifest, operation, checksum, package, or selection check
produces no admissible selection artifact and must stop the operation.
