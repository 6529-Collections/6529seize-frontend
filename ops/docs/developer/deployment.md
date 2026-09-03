# Deployment

Agents and developers deploy with ordinary merges and the repository's GitHub
Actions workflows. Use the phase authorized by the user; a staging request does
not authorize production.

| Target     | Frontend                                                                       | Backend                                                                                                         |
| ---------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Staging    | Merge into `1a-staging` and push; `Web Deploy - STAGING` starts automatically. | Merge into `1a-staging`, then dispatch `Deploy a service` for each required service with `environment=staging`. |
| Production | Merge into `main`, then dispatch `Web Deploy - PROD`.                          | Merge into `main`, then dispatch `Deploy a service` for each required service with `environment=prod`.          |

Frontend staging retains its existing `ops/**`-only push exclusion. Dispatch
`deploy-staging.yml` on `1a-staging` when an authorized ops-only change needs an
actual deployment.

## Order and completion

- Fetch shared refs before merging; preserve other developers' staging changes
  and resolve conflicts normally. Never force-push a shared branch.
- Read backend `src/config/deploy-services.json` and the change to select the
  required services and dependency order. Dispatch backend services one at a
  time, wait for success, then continue in the same task.
- Deploy backend dependencies before merging/deploying dependent frontend
  changes in each environment. A schema/API change commonly needs
  `dbMigrationsLoop` before `api`, then dependent frontend changes; queues and
  consumers may need their own earlier steps.
- Keep CI, artifact integrity, deployed-version checks, and health checks.
  Frontend workflows run their E2E checks automatically as part of the same
  deployment. Follow the complete result before calling a deployment validated.
- Coordinate potentially conflicting deployments through GitHub run visibility;
  existing concurrency is repository-scoped. Do not cancel another developer's
  run. Wait for that work to finish when the environment would conflict.

## Workflow dispatch examples

Run these only after the corresponding merge and within the authorized scope.
Select the service needed by the change; `api` below is an example.

```bash
gh workflow run deploy.yml -R 6529-Collections/6529seize-backend \
  --ref 1a-staging -f environment=staging -f service=api

gh workflow run build-upload-deploy-prod.yml \
  -R 6529-Collections/6529seize-frontend --ref main
```

Find the new run by workflow, branch, service, and commit; follow that run to
completion. The workflows resolve and verify the source commit and artifact
identity automatically.

Backend production also carries release-note inputs:

- `release_pull_request`: merged PR represented by the deployment;
- `release_group_services`: the complete comma-separated service set, unchanged
  across that PR's sequential deployments;
- `release_note_publish`: `false` until the final service, then `true`;
- `release_note_groups`: per-PR groups when several PRs share the deployment;
- `release_note_opt_out=true`: an authorized internal operation that should not
  create a release note, with PR/group metadata omitted and publish left false.

The autonomous bot owns release-note writing and publication. Preserve its
metadata and final signal. CI wave notifications are best effort and use deploy
run IDs to correlate E2E replies.

## Failure and rollback

Inspect the failing job and logs. Fix attributable failures on the development
branch, merge the fix into the authorized target, and repeat only the required
deployments. Keep dependent frontend changes waiting for successful backend
dependencies. A passed deploy with failed E2E is deployed but unvalidated.

Use a reviewed revert or compatible known-good source through the same ordinary
workflow for rollback; retain shared history and account for database/API
compatibility. Do not drop schema as part of a routine application rollback.
Report the run links, affected services, health/E2E outcomes, and remaining
failures. Preserve useful logs and artifact evidence without exposing secrets.

See [CI wave notifications](ci-wave-deploy-validation-notifications.md), [package commands](pnpm-and-socket-firewall.md), and the [deployment skill](../../skills/deploy-6529/SKILL.md).
