# One-click production child identity

`ops/scripts/one-click-production-children.cjs` is the dependency-free
identity boundary used by the parent **Web Deploy - PROD** operation. It does
not acquire a Release Bus lease, call the backend, dispatch workflows, deploy,
or select artifacts by age. It gives the parent one small, testable contract
for validating child workflow and artifact evidence.

## Stable operation and titles

The parent supplies its numeric GitHub Actions run ID and the frozen lowercase
40-character target commit:

```bash
node ops/scripts/one-click-production-children.cjs validate-operation \
  --parent-run-id 987654 \
  --target-sha aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

The result derives exactly `frontend-prod-987654`. A rerun keeps that same
operation ID; `run_attempt` is evidence about the specific attempt and is
never promoted into a new operation identity. The title command produces the
exact operation-bound child titles:

```text
Build production artifact <target_sha> [<operation_id>]
Verify production artifact <target_sha> [<operation_id>]
```

The builder and verifier workflow paths are fixed by the helper:

```text
.github/workflows/production-build-artifact.yml
.github/workflows/production-artifact-verifier.yml
```

## Selecting a child workflow run

The parent passes a bounded GitHub `actions/runs` response to `select-run`.
The helper scans the returned array without sorting and without reading
`created_at`. A candidate is trusted only when all of these fields match:

- this repository in both `repository.full_name` and
  `head_repository.full_name`;
- the exact workflow path and numeric `workflow_id`;
- the exact derived display title;
- `head_branch: main` and `event: workflow_dispatch`;
- a lowercase 40-character child workflow `head_sha`, which is returned as
  observed identity rather than predicted by the parent.

The child workflow head is version evidence. It may be a later `main` commit
than the frozen target. The target remains separately bound by the operation
title and artifact name; the parent/build workflow must independently prove
that the target remains in protected `main` history. This avoids a race between
the parent's ref observation and the child dispatch: the parent does not guess
which `main` SHA GitHub records on the child run.

The selection result is deliberately small:

- `result: selected` with `state: reusable` for one completed successful run;
- `result: selected` with `state: active` for one queued/in-progress run;
- `result: absent` with `state: failed_terminal` and retained
  `failed_terminal_runs` when only failed terminal runs exist;
- `result: absent` when there is no exact identity match, or when the exact
  candidate is outside the caller's `allowedStates`.

Failed terminal matches are retained as bounded evidence but are never eligible
for selection. One old failed child plus one eligible active/reusable retry is
therefore valid. More than one eligible active/reusable identity is an
ambiguity error. The parent must never turn a failed terminal run into a
reusable artifact or resolve an ambiguity by choosing the newest run.

Example:

```bash
node ops/scripts/one-click-production-children.cjs select-run \
  --input workflow-runs.json \
  --workflow-path .github/workflows/production-build-artifact.yml \
  --workflow-id 123456 \
  --operation-id frontend-prod-987654 \
  --target-sha aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --allowed-states reusable
```

## Validating exact artifact metadata

`validate-artifact` accepts a bounded bundle containing the exact producer run,
the API artifact list, and optionally the downloaded v2 manifest, plus the
`run` object returned by a successful `select-run` call. The parent supplies
the exact run ID/attempt, artifact ID/name, and GitHub API digest. The helper
requires:

- the producer run is the exact successful `workflow_dispatch` child on
  `main`, in this repository, at the expected workflow path and ID;
- the API run's ID, attempt, status, head SHA, and display identity match the
  previously selected run object;
- exactly one artifact can match the requested ID or operation-bound name;
- the artifact is named
  `production-frontend-<target_sha>-<operation_id>` and has `expired: false`;
- the artifact's `sha256:<64 lowercase hex>` API digest matches the supplied
  digest and its attached workflow run ID (and, when present, attempt/head);
- when a v2 manifest is supplied, its target, operation, producer run/attempt,
  workflow head, production environment, and protected-main evidence match.

The API digest is not inferred from an artifact list position, name recency,
or `created_at`. A same-name duplicate is an ambiguity error. The helper
returns only bounded identifiers and digests for shell consumption.

The helper verifies identity and the manifest's separation between `target_sha`
and `workflow_sha`; it does not replace the required Git ancestry proof that
the frozen target remains reachable from protected `main` immediately before
build and AWS mutation.

## Validating the standalone verifier selection artifact

The verifier publishes its own immutable selection artifact. It is a separate
evidence object from the builder's production package, and it must be checked
by a separate validator:

```text
one-click-production-selection-<target_sha>-a<verifier_run_attempt>
```

`validate-selection` accepts the exact successful verifier run selected by the
same identity rules, the verifier's bounded artifact list, and the builder
artifact identity that the verifier was meant to attest. It requires exactly
one candidate with the requested artifact ID or name, the exact verifier run
ID and attempt attached, `expired: false`, and the API-provided
`sha256:<64 lowercase hex>` digest. It never chooses by list order, age, or
`created_at`.

When `selection.json` is supplied in the metadata bundle, the validator also
checks the production selection contract, frozen target and operation, every
builder artifact identity field, the builder workflow SHA, the verifier
workflow SHA, verifier run and attempt, and the expected selection-artifact
name. It recomputes `selection_digest` using the verifier-compatible canonical
JSON rule: object keys are sorted recursively, arrays retain their order, and
the resulting UTF-8 JSON is SHA-256 hashed. The file's claimed digest is never
treated as authority. The validator also checks the verifier's protected-main,
manifest, checksum, package, and archive evidence fields when present in the
contract.

This keeps the evidence chain explicit:

```text
frozen target_sha
  └─ builder artifact (builder run + workflow_sha)
       └─ standalone verifier run (verifier workflow_sha + attempt)
            └─ selection artifact (API ID/name/digest + exact attachment)
                 └─ selection.json (recomputed, semantically checked digest)
```

The parent may use the returned verifier `head_sha` as observed workflow
identity even if `main` advanced between ref observation and child dispatch.
The frozen target remains a distinct field throughout.
