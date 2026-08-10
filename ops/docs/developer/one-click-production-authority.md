# One-click production authority client

`ops/scripts/one-click-production-authority.cjs` is the local boundary for the
frontend one-click production workflow's four production-authority calls. It
has no HTTP client, reads no environment variables, accepts no credential
options, and never prints request or response contents during validation.

The helper emits canonical JSON request bodies for the pending backend API:

```text
/deploy/release-bus-v2/production-authority/acquire-bind
/deploy/release-bus-v2/production-authority/reauthorize
/deploy/release-bus-v2/production-authority/complete
/deploy/release-bus-v2/production-authority/fail
```

The parent workflow run is the authority owner. The helper derives
`operation_id` as `frontend-prod-<parent run id>` and fixes the remaining
frontend production identity fields. All SHA and run identifiers are bounded
and validated before a body is emitted.

## Build request bodies

Each command writes one compact, recursively key-sorted JSON object to stdout.
The examples use dummy values only.

```powershell
$target = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

node ops/scripts/one-click-production-authority.cjs acquire-bind `
  --parent-run-id 9001 `
  --target-sha $target `
  --workflow-run-id 123456 `
  --workflow-run-attempt 1 > acquire-bind.json

node ops/scripts/one-click-production-authority.cjs reauthorize `
  --parent-run-id 9001 `
  --target-sha $target `
  --workflow-run-id 123456 `
  --workflow-run-attempt 1 `
  --selection-digest bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb > reauthorize.json

node ops/scripts/one-click-production-authority.cjs complete `
  --parent-run-id 9001 `
  --target-sha $target `
  --workflow-run-id 123456 `
  --workflow-run-attempt 1 `
  --selection-digest bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb `
  --qualifier-workflow-run-id 789012 `
  --qualifier-workflow-run-attempt 1 `
  --evidence-digest cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc > complete.json

node ops/scripts/one-click-production-authority.cjs fail `
  --parent-run-id 9001 `
  --target-sha $target `
  --workflow-run-id 123456 `
  --workflow-run-attempt 1 `
  --selection-digest null `
  --reason-code ABORTED > fail-before-selection.json
```

For a failure after selection, pass the exact lower-case selection digest. The
client does not infer or discover a persisted selection.

## Validate a response

Validation requires the request file, the expected identity, expected terminal
state, and expected lock version. Response JSON is read from `--response-file`
or stdin when that option is omitted. The validator rejects extra fields,
duplicate JSON keys, sensitive-looking fields, mismatched identity, stale
selection digests, unexpected state booleans, epoch drift, and lock-version
drift.

```powershell
node ops/scripts/one-click-production-authority.cjs validate-response acquire-bind `
  --request-file acquire-bind.json `
  --parent-run-id 9001 `
  --target-sha $target `
  --workflow-run-id 123456 `
  --workflow-run-attempt 1 `
  --expected-selection-digest null `
  --expected-status BOUND `
  --expected-authorized true `
  --expected-bound true `
  --expected-control-epoch-json '{"all":7,"mode":"OFF","production":11}' `
  --expected-lock-row-version 19 `
  --response-file acquire-bind-response.json
```

For `reauthorize`, use the exact non-null expected selection digest. For
`complete`, add the expected qualifier run/attempt and evidence digest and use
`--expected-completed true`. For `fail`, add the expected reason code and use
`--expected-failed true`; `--expected-selection-digest null` is the explicit
pre-selection form.

Successful validation prints only `VALID`. Any failure prints a stable error
code to stderr and exits non-zero. The helper intentionally has no command for
credentials, URLs, retries, or network calls; those responsibilities remain
in the workflow and backend control plane.
