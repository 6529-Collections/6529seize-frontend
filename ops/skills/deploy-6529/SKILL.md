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
3. Fetch the destination branch and merge without discarding other developers'
   work. If it moves, fetch and recompute; resolve conflicts in the development
   branch where appropriate. Never force-push shared branches.
4. Use GitHub Actions run visibility to avoid conflicting deployments. Wait for
   another developer's conflicting work to finish; do not cancel it. Existing
   workflow concurrency is repository-scoped, so coordinate coupled BE/FE
   work explicitly.

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
