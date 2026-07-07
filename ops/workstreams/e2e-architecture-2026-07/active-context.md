# Active Context

## Resume first

- Campaign plan approved 2026-07-06; delivery started 2026-07-07.
- Worktree: `D:\repos\6529seize-frontend-e2e-arch`, node_modules junction to
  the main checkout.
- PR 1 (Device Farm cron split) open: qa/device-farm-daily-web, PR #3189.
- PR 2 (this change): claude/e2e-pack-manifest — manifest + sync + runner +
  drift gate + staging-e2e migration with legacy fallback.
- Next after PR 2 merges: rehearse Staging E2E via workflow_dispatch, then
  PR 3 (prod daily canary cron on the runner).

## Sequencing constraints

- 3, 5, 9 depend on 2; 6 depends on 5; 7 and 8 depend on 6; 10 depends on
  2 + 4; 11 depends on 5.
- staging-e2e.yml keeps the legacy inline pack loop until `1a-staging`
  contains `scripts/e2e-packs.cjs` (workflow_run executes main's YAML against
  the deployed checkout). Remove the fallback in a follow-up PR after the
  next staging deploy from a main that includes PR 2.

## Escalation triggers

- Any bot lane blocking on a judgment call.
- Changes to deploy workflows beyond the planned diffs.
- Secrets: MOBILE_REPO_TOKEN, staging synthetic identity.
