# One-click production child runner

`ops/scripts/run-one-click-production-children.cjs` is the network-facing
controller used by the authorized `Web Deploy - PROD` job. It has GitHub Actions
read/write authority for the frontend repository, but it has no AWS or Release
Bus credentials.

The runner freezes the parent operation's target SHA and operation identity,
resolves the numeric builder and verifier workflow IDs from the fixed workflow
paths, and then manages exactly one operation-bound child of each kind. It
accepts a reusable successful child, waits for one active child, or dispatches
one child on `main` when only failed terminal history or no exact history is
present. It never selects by creation time, list order, or predicted workflow
head SHA. A second eligible child, a changed observed child identity, or a
terminal failure is fatal.

The builder artifact is selected by its exact operation-bound name and checked
with the shared child validator for run ID, run attempt, workflow identity,
expiry, GitHub API digest, and producer attachment. The verifier receives that
exact artifact identity. Its immutable selection artifact is checked in the
same way, downloaded by artifact ID, and opened locally so the
`selection.json` canonical SHA-256 digest is independently verified.

GitHub responses are bounded and use API version `2022-11-28`. Every request
has an abort-aware timeout. Polling is bounded by both a configurable test
limit and a 60-minute production ceiling. Errors contain method, path, and
status only; authorization headers and response bodies are never logged.

Example invocation inside Actions:

```bash
node ops/scripts/run-one-click-production-children.cjs \
  --repository "$GITHUB_REPOSITORY" \
  --target-sha "$GITHUB_SHA" \
  --operation-id "frontend-prod-$GITHUB_RUN_ID" \
  --parent-run-id "$GITHUB_RUN_ID" \
  --parent-run-attempt "$GITHUB_RUN_ATTEMPT" \
  --output-file "$RUNNER_TEMP/one-click-children.json" \
  --github-output "$GITHUB_OUTPUT"
```

The canonical JSON output and `GITHUB_OUTPUT` contain only the exact public
identifiers required by the deploy job: builder/verifier run IDs, attempts and
observed workflow heads; builder artifact ID, name and API digest; selection
artifact run/attempt, ID, name and API digest; and the semantic
`selection_digest`.

The focused test suite uses an injected, network-free GitHub adapter. It covers
fresh dispatch, reuse, failed-only redispatch, active retries, ambiguity,
identity forgery, later `main` descendants, artifact and selection tampering,
child failure, timeout, HTTP failure sanitization, deterministic output, and
the GitHub output-file contract.
