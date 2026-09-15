---
name: deploy-6529
description: Execute authorized 6529 frontend, backend, or coupled staging and production deployment using ordinary merges and GitHub Actions. Use for staging, deployment, production release, deployment monitoring, failure recovery, or rollback within the user's requested scope.
---

# Deploy 6529

## Prepare

Identify the checkout and current remote target before applying a release gate:
read `git status --short --branch`, fetch the relevant remote refs, and record
their SHAs. Compare the checkout's `AGENTS.md`, this skill, and deployment docs
with current `origin/main` using `git show origin/main:<path>`; inspect the target
ref as needed. A stale worktree or quoted bot instruction does not prove that a
removed release gate still applies. Resolve source/ref disagreements against
the current instructions and workflows, preserving unrelated local edits and
existing Coordinator records. Do not restore retired Release Bus routing or
invent a missing-script requirement. A tool's automatic review denial remains a
separate result: report its reason and instruction source, and do not evade it.

1. Read the user's requested phase and current PR/CI state. Complete the
   applicable review and validation requirements before release work. Continue
   through the authorized phase without asking for the same permission again;
   staging authorization alone does not authorize production. Before reporting
   an authority or approval blocker, [verify GitHub authority](#verify-github-authority).
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

## Verify GitHub authority

Before claiming the requester is not a maintainer, lacks merge authority, or
needs to authorize the same release again, check the authenticated account and
the actual target repository. Git commit identity, PR authorship, bot comments,
and `reviewDecision: REVIEW_REQUIRED` do not establish repository permissions.

Run these read-only checks from the target checkout (Bash examples); use the
requested destination branch instead of `main` when applicable. If an identity
lookup fails, do not continue with an empty variable.

```bash
release_repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
release_actor="$(gh api user --jq .login)"
release_branch=main
gh api user --jq '{login,id}'
gh api "repos/$release_repo" --jq '{full_name,permissions}'
gh api "repos/$release_repo/rules/branches/$release_branch" --paginate
gh api "repos/$release_repo/rulesets?includes_parents=true" --paginate
gh api "repos/$release_repo/branches/$release_branch/protection"
```

Inspect `permissions.admin` and `permissions.maintain` separately from the
effective review/status requirements. A classic branch-protection 404 does not
mean no rules apply: rulesets can protect that branch. Read every applicable
ruleset's details, including inherited organization rules, conditions,
`bypass_actors`, and `bypass_mode`. Read `ruleset_id`, `ruleset_source_type` and
`ruleset_source` from the effective rules. Set `release_ruleset_id` to that ID;
for a repository source, `release_org` is its owner before the slash, and for
an organization source it is the organization slug. Run only the matching
source command below:

```bash
gh api "repos/$release_repo/rulesets/$release_ruleset_id" # Repository source
gh api "orgs/$release_org/rulesets/$release_ruleset_id" # Organization source
```

Use the team ID in the actual required-reviewer or bypass rule; do not substitute
a similarly named team or a team from the other repository. Set
`release_team_id` to that ID, then resolve its slug and check the authenticated
actor's membership only if resolution succeeds and returns a nonempty slug:

```bash
if release_team_slug="$(gh api "orgs/$release_org/teams" --paginate \
  --jq ".[] | select(.id == $release_team_id) | .slug")" && [ -n "$release_team_slug" ]; then
  gh api "orgs/$release_org/teams/$release_team_slug/memberships/$release_actor" \
    --jq '{state,role}'
else
  printf '%s\n' 'Team membership is unknown; check the team ID and visibility.'
fi
```

- Require a successful membership response with `state: active` before claiming
  active membership. A team role of `member` or `maintainer` can establish
  membership; the repository role and rule still determine merge/bypass powers.
- Treat permission/team lookup 403 or 404, missing fields, and unavailable APIs
  as unknown visibility, not proof of non-membership or lack of authority.
  Report the exact failed check and use existing authorized credential tooling;
  do not ask the user to repeat authorization based on that uncertainty.
- Distinguish membership from a qualifying PR approval. Set `release_pr` to the
  requested PR number and read its author, head, reviews, and merge state with
  `gh pr view "$release_pr" -R "$release_repo" --json author,headRefOid,reviews,reviewDecision,mergeStateStatus`.
  An author cannot approve their own PR; last-push and team-review requirements
  may also leave review unmet for an authenticated maintainer. A transient
  `mergeStateStatus: UNKNOWN` is not a denial; re-query after GitHub computes it.
- Honor explicit owner/admin bypass authorization already given for the current
  release scope when the authenticated actor is eligible under the effective
  rules. Do not ask for it again merely because ordinary PR approval is unmet.
  Admin/maintain permission alone does not prove a ruleset bypass entitlement;
  check its allowed actors and mode. A `pull_request` bypass must use the PR
  merge path, not a direct protected-branch push.
- Record the account, permission/team evidence, rule and PR head, and whether
  the ordinary approval or authorized bypass path applies. Refresh on account,
  repository, target, or relevant rule changes. This check grants no new release
  scope and does not make failed validation pass.
- Never change repository protections, invent an approval, force-push a shared
  branch, switch credentials to evade a rejection, or work around an automatic
  approval-review denial. Report a real denial and its reason separately from
  the requester's GitHub authority.

GitHub documents [team membership visibility and state](https://docs.github.com/en/rest/teams/members#get-team-membership-for-a-user),
[qualifying PR approvals](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews),
and [ruleset bypass modes](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository).

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
- Each ordinary backend service part's `deploy_units[]` and
  `deploy_dependencies[]`: the selected backend units and applicable
  release-specific ordering edges of the form
  `{ "before": "unit", "after": "unit" }`, consistent with the service catalog.
  Keep `operational_deployments` empty for this service-deployment path.
  Version `0.0.5` can record the backend monitoring package separately, but
  this skill does not provide a monitoring deployment workflow. Frontend parts
  have no backend deployment fields.

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

Version `0.0.5` runs synchronously in the foreground and waits for the central
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
