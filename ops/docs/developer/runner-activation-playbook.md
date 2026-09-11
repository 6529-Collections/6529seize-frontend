# Build-runner benchmark and activation playbook

This playbook defines how the Museum release program may measure and, later,
adopt a faster trusted build runner. The benchmark is an observation tool. It
does not grant runner capacity, change GitHub billing, set repository variables,
or alter the deployment process.

## Current status

As of 2026-08-05, the 6529 Collections organization has no GitHub-hosted
larger-runner entitlement, no self-hosted runners, and no repository runner
variables configured for this program. No candidate label is therefore active.
The `ubuntu-latest` control path remains the only available fallback. This
status is recorded explicitly so a missing label is reported as unavailable,
not as a slow or successful benchmark.

## What the benchmark does

The controller is manually dispatched from `main` with an exact commit SHA, an
explicit label, a profile, a queue-availability timeout (90 seconds by
default), a workload-completion timeout (30 minutes by default), and a repeat
count. It verifies that the SHA is a commit reachable from trusted `main`,
generates an unguessable controller nonce, and dispatches the read-only
candidate workflow with a request identifier derived from every intended input,
the controller run ID and first attempt, and that nonce. A direct human
candidate dispatch is deliberately unsupported: it is scheduled on
`ubuntu-latest` and fails before source checkout. Only a dispatch authenticated
as `github-actions[bot]`, with a matching first-attempt controller run, may
select dynamic candidate capacity.

The controller observes, cancels, and records evidence only after the returned
run metadata matches the request, the candidate workflow path,
`workflow_dispatch`, trusted `main`, the expected main SHA, the bot actor,
attempt 1, and the complete input-bound request identifier.

The queue-availability timeout only limits how long the controller waits for a
run to be accepted. Once a verified run exists, the separate completion
timeout governs the build workload; the 90-second queue budget never cancels an
accepted build. The controller derives a bounded job timeout from the repeat
count and both budgets, then performs a final reconciliation pass. Delayed
accepted runs are either observed to terminal state or cancelled only after a
fresh metadata verification. Transient run-list failures remain unavailable
and fail closed rather than authorizing an unverified cancellation.

The candidate uses three trust boundaries:

- an Ubuntu authorization job that authenticates the candidate run, controller
  run, actor, attempt, and exact request binding before runner selection;
- a measured source job that checks out two things separately:

- the benchmark tool from the trusted workflow SHA; and
- the exact source SHA being measured, which must be an ancestor of `main`;

- a separate Ubuntu verifier job with a fresh immutable tool checkout. The
  measured job has no Actions API permission or `GH_TOKEN`; its output is
  treated as untrusted data. Only the verifier may read run metadata, rebind
  all intended inputs, and write hashed evidence.

Candidate inputs are validated before the source checkout, including
profile/label, timeout, repeat, request-ID, controller run ID/attempt, and
nonce cross-fields. Reusable `workflow_call` invocations are forced to the
`ubuntu-latest` control profile in both execution and evidence metadata. The
candidate activates the repository-pinned pnpm `10.33.0` before setup-node cache
setup or dependency installation.

Evidence records queue, setup, checkout, dependency install, build, and package
durations, together with non-secret runner and toolchain metadata. A candidate
run must pass a final run-metadata readback and an exact raw-observation
rebind before evidence is written. Each run writes canonical JSON and Markdown
files to a unique immutable Actions artifact. If delayed-run reconciliation is
incomplete, the state remains `reconciliation_pending`, cleanup is false, and
evidence generation fails; it is never reported as completed evidence.

The control profile is the same workload on `ubuntu-latest`. It is the fallback
comparison and must remain available even after a candidate runner is adopted.

## Evidence required before activation

A maintainer may propose activation only after all of the following are present
in the immutable benchmark artifacts for the same exact source SHA and build
profile:

1. The capacity has actually been provisioned and its label is recorded. A
   label is not considered provisioned because it was typed into a dispatch
   form.
2. At least ten successful candidate observations, distributed across at least
   three controller runs, with the complete stage timing fields present. Any
   unavailable, cancelled, or failed observation is retained and explained;
   it is not removed from the sample.
3. p50 and p95 values for queue, setup, checkout, install, build, and package
   stages, with the sample count and calculation method published.
4. A measured cost per successful build for the candidate and the
   `ubuntu-latest` control, including the billing assumptions and the cost of
   failed or cancelled observations. If cost cannot be measured, activation is
   blocked rather than inferred from elapsed time.
5. Evidence that the candidate is faster at the target workload without a
   regression in build correctness, package checks, or evidence integrity.
6. A rollback plan that returns `CI_BUILD_RUNNER`, `STAGING_BUILD_RUNNER`, and
   `PRODUCTION_BUILD_RUNNER` to their previous values (normally unset, falling
   back to the trusted Ubuntu runner), with an owner, a tested exact SHA, and a
   readback proving the fallback is serving builds.
7. A security review confirming that untrusted fork jobs remain on the default
   runner and that no deployment credential is available to the benchmark or
   ordinary PR jobs.

The winning shape is selected on measured p95 and cost per successful build,
not on nominal vCPU count. A faster but materially more expensive shape is not
automatically the winner; the decision and tradeoff belong in the release
record.

## Activation sequence

1. Provision the runner capacity outside this repository's code changes. Record
   the provider, image/toolchain digest, runner group, label, region, and cost
   model. Do not provision through a workflow running candidate code.
2. Run the controller against the exact merged `main` SHA with the candidate
   profile and a repeat count that produces the required sample. Run the
   `control` profile against the same SHA and workload.
3. Publish the raw JSON/Markdown artifacts and a reviewer-written comparison
   containing p50, p95, cost, failures, and the selected shape. A missing or
   mismatched artifact is a failed gate.
4. Add the runner variable configuration through the repository's normal
   maintainer-controlled settings process. The benchmark PR does not do this.
   Start with the CI build variable only; keep staging and production on the
   existing fallback until the candidate has passed a staging qualification.
5. Run the exact PR, staging, and production build/read-only qualification
   paths. Confirm that the runner label is resolved, the source SHA is exact,
   and the package/artifact digests remain valid.
6. Promote the remaining build variables only after the same evidence is green.
   Keep `ubuntu-latest` available as an immediate fallback.
7. Record the settings readback, first adopted release, comparison artifacts,
   and rollback boundary in the Museum release workstream log.

## Rollback

Rollback is a configuration change under maintainer control, not a benchmark
workflow action. Clear the adopted runner variable or restore its prior value,
confirm that the effective runner resolves to `ubuntu-latest`, and run one exact
source-SHA control build. If the candidate label disappears, the controller's
`unavailable` result is itself the trigger to keep or restore the fallback; it
must not be converted into a passing release result.

No activation or settings mutation has been performed as part of this PR.
