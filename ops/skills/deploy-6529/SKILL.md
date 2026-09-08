---
name: deploy-6529
description: Execute authorized 6529 frontend, backend, or coupled staging and production deployment using ordinary merges and GitHub Actions. Use for staging, deployment, production release, deployment monitoring, failure recovery, or rollback within the user's requested scope.
---

# Deploy 6529

## Prepare

1. Read the user's requested phase and current PR/CI state. Complete the
   applicable review and validation requirements before release work. Continue
   through the authorized phase without asking for the same permission again;
   staging authorization alone does not authorize production.
2. Determine the affected repositories and backend services from the diff and
   backend `src/config/deploy-services.json`, including real dependency order
   and allowed environments. Deploy only required units. Follow each repo's
   `6529` wrapper rules for package commands.
3. For a new staging or direct production release intent that includes frontend,
   establish the exact release inputs: requester, target, database-change status,
   PR branches, and full PR head SHAs. Follow
   [Coordinator release recording](#coordinator-release-recording) before any
   merge or deployment mutation.
4. Fetch the destination branch and merge without discarding other developers'
   work. If it moves, fetch and recompute; resolve conflicts in the development
   branch where appropriate. Never force-push shared branches.
5. Use GitHub Actions run visibility to avoid conflicting deployments. Wait for
   another developer's conflicting work to finish; do not cancel it. Existing
   workflow concurrency is repository-scoped, so coordinate coupled BE/FE
   work explicitly.

## Coordinator release recording

Run this step once per new staging release intent or new direct production
release intent that includes frontend. For a coupled release, submit one request
from the frontend repository containing all relevant frontend and backend parts.
Backend-only work is outside this integration.

Do not create another request for status checks, monitoring, merge-only work,
retries, resumes, recovery, production continuation, or promotion of an already
recorded release. Reuse the existing outcome and evidence on continuation,
including after a returned failure; do not resubmit to repair the record during
the release.

From the repository root, print the installed CLI's current input template:

```bash
./bin/6529 exec 6529-release-request template
```

This command is read-only and creates no request or run record. Fill the current
template with actual release metadata:

- `requested_by`: the actual requester; `target`: `staging` or `production`;
  `database_change`: `yes`, `no`, or `unknown` when not yet confirmed.
- `release_parts[]`: each included part's `id`, `repository`
  (`6529seize-frontend` or `6529seize-backend`), `pull_requests[]`, and
  `depends_on[]` part IDs for real prerequisites.
- Each PR's `number`, source `branch`, and `commit`: its verified exact
  40-character lowercase head SHA, not a short SHA or destination branch name.
- Each backend part's `deploy_units[]` and `deploy_dependencies[]`: the selected
  backend units and applicable release-specific ordering edges of the form
  `{ "before": "unit", "after": "unit" }`, consistent with the service catalog.
  Frontend parts have no backend deployment fields.

Remove absent template parts and references to them; for a frontend-only release,
remove the backend part and set frontend `depends_on` to `[]`. Replace all sample
values with verified inputs, retaining empty dependency arrays when applicable.
Do not provide `schema_version`, `request_id`, or `created_at`; the CLI generates
them. The central inbox is public: include only release metadata, never tokens,
cookies, signed URLs, environment values, production data, or private context.
`requested_by` is descriptive context, not authentication or approval; the
central workflow records the actual GitHub sender.

Pass the completed JSON exactly once through standard input to:

```bash
./bin/6529 exec 6529-release-request submit --input -
```

Use a shell conditional to capture the command's actual exit status so `set -e`
does not abort on an ordinary returned failure. Do not mask the status with
`|| true`. Do not create an extra input file or call `create` separately:
`submit` owns creation, validation, local records, central workflow dispatch,
waiting, and result handling. It saves run records under
`.release-coordinator/runs/` and valid requests under `.release-coordinator/outbox/`.
Do not duplicate submission, choose or dispatch its workflow, or poll it
separately through direct `gh` commands.

Version `0.0.4` runs synchronously in the foreground and waits for the central
GitHub workflow. Queueing and execution can add waiting time before deployment.
Re-verify these semantics against the installed CLI when changing its version.
Do not retry, background, detach, or wrap it in an invented shell timeout. If the
wait does not return, report the available evidence and escalate to the
Coordinator owner; do not interrupt it merely to continue deployment.

Handle the outcome before returning to Prepare:

- Success (exit `0`): retain and report `request_id`, `inbox_issue_number`,
  `inbox_issue_url`, `workflow_run_url`, `run_path`, and `request_path`, then
  continue the existing authorized direct deployment steps.
- Ordinary returned failure (exit `1` through `127`): report one short warning
  with the reason or first error and any available request ID, Issue/workflow
  links, and local record paths. Keep the local records and continue the same
  authorized deployment path without requiring a recording fix. This includes
  returned setup, input-validation, and dispatch errors: successful submission
  is not a deployment gate. Report missing evidence honestly.
- Signal-style interruption (exit `128` or higher): report the status and
  available evidence, stop release work, and escalate to the Coordinator owner.
  Do not silently treat an interrupted or unfinished wait as an ordinary failure.

An accepted request records the release intent in the public Coordinator inbox.
It grants no approval or deployment authority and does not replace the existing
authorization, merge, dependency-order, deployment, or validation requirements.
At closeout, include the recording outcome and retained evidence described above.

## Staging

1. For backend changes, merge the development branch into current `1a-staging`
   and push. Dispatch `.github/workflows/deploy.yml` (`Deploy a service`) with
   `--ref 1a-staging`, `environment=staging`, and the first required `service`.
2. Identify the dispatched run by repository, workflow, branch, service, and
   commit. Wait for success, then dispatch the next required service in
   dependency order. Continue in the same task until the authorized backend
   sequence is complete.
3. After required backend dependencies are deployed, merge the frontend
   development branch into current `1a-staging` and push. The existing
   `Web Deploy - STAGING` push trigger deploys automatically for application
   and workflow changes; its existing `ops/**`-only exclusion remains. When an
   authorized ops-only change needs deployment, dispatch `deploy-staging.yml`
   on `1a-staging` explicitly.
4. Wait for the frontend build, artifact verification, deployed-version check,
   and health checks. Successful Web Deploy completion starts Staging E2E
   separately. Do not wait for E2E before reporting deployment complete or
   continuing to the next authorized environment; report its current status
   separately. Fix known regressions attributable to the change.

## Production

1. With production authorization, merge the backend development branch into
   current `main`, then dispatch `Deploy a service` with `--ref main`,
   `environment=prod`, and each required service sequentially. Wait for each
   dependency to succeed before continuing.
2. Supply the merged PR number and complete canonical service set for the
   release to each backend production run. Set `release_note_publish=true`
   only for the final successful service. Use `release_note_groups` when the
   release contains multiple PR groups, preserving their service membership.
   Keep autonomous release notes enabled, including for internal maintenance.
   Only if the user explicitly asks to suppress notes, omit PR/group metadata,
   set `release_note_opt_out=true`, and leave `release_note_publish=false`.
3. After required backend dependencies are deployed, merge the frontend
   development branch into current `main` and dispatch
   `.github/workflows/build-upload-deploy-prod.yml` (`Web Deploy - PROD`) with
   `--ref main`. The workflow builds, verifies, and deploys. Its successful
   completion automatically starts a separate Production E2E workflow.
4. Complete the deployment after its artifact, version, and health checks pass.
   Report Production E2E separately; it does not gate release completion.
   Preserve the workflow's autonomous release-note notification; never compose
   or publish the note yourself.

## Failure and closeout

Inspect failed jobs and logs before retrying. A failed deployment, artifact,
version, or health check blocks deployment completion; a green build alone is
not sufficient. Automatic E2E is asynchronous and reports its own result.
Do not hold up releases for pending E2E or unrelated failures such as Museum
checks on a change outside Museum. Keep relevant build, unit/contract, and
security checks. If an aggregate PR check is blocked solely by unrelated E2E,
record the result and use the authorized merge path without changing repository
protections or claiming those tests passed. Fix known attributable regressions
through the development branch and the authorized deployment sequence.

Roll back through the ordinary deployment workflow using a reviewed
revert or compatible known-good source, preserving shared branch history and
checking database/API compatibility first.

Report the PRs, deployed services and order, deployment run links, available
E2E results, and any remaining failure. The workflows resolve and
verify commits and artifact digests automatically; developers supply ordinary
branch/environment/service choices. Keep credentials and private data out of
reports.

## Reference

Read [Deployment](../../docs/developer/deployment.md) for workflow commands and recovery.
