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

## Recovery access and automatic completion

Manual dispatch of `production-authority-complete.yml` has two modes. The
default `recover` mode is restricted to `main`, requires the exact terminal
production workflow run ID, and may complete or fail the matching authority.
The `authorization-check` mode also runs only from `main` and stops immediately
after validating the dispatcher; it does not read terminal evidence or call a
Release Bus production-authority endpoint. Keeping both modes on `main` ensures
the secret-consuming membership check uses the trusted workflow revision. Both
manual modes require the dispatcher to be an active member of the GitHub team
`6529-Collections/6529seize-maintainers`. The workflow resolves membership at
run time for the user who started the current attempt, including a rerun,
rather than maintaining a second list of GitHub usernames. The
Release Bus GitHub App installation must therefore grant organization
**Members: read** permission; the workflow requests only that permission for
the short-lived membership token. The existing app ID and private-key settings
are `RELEASE_BUS_GITHUB_APP_ID` and
`RELEASE_BUS_GITHUB_PRIVATE_KEY`.

Automatic completion is dispatched by `github-actions[bot]` after the exact
Production E2E run becomes terminal. Its trusted path is independently limited
to an exact `production-e2e.yml` run, so it does not use the human team gate.
The E2E workflow itself runs from protected `main`, whose workflow-source SHA
can legitimately advance after the production deployment. Completion is bound
to the deployment through the deploy run ID, exact run titles, immutable
selection and qualification artifacts, and the deployed SHA recorded in that
evidence; it must not require the E2E workflow-source SHA to equal the deployed
SHA.

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
