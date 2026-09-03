---
name: write-prs
description: Write, open, iterate, and prepare pull requests for merge or deployment with clear PR descriptions, safe validation notes, review-bot follow-up, signed commits, readiness gates, and deployment handoff notes. Use when preparing PR bodies, creating PRs, responding to CodeRabbit or Claude review bots, deciding whether a PR is ready, or preparing a PR for merge, staging, or production rollout; use deploy-6529 for actual deployment execution.
---

# Write PRs

## Workflow

1. Determine the requested completion mode:
   - `review-ready`: create or update the PR and stop once available review bots and the agent are satisfied.
   - `merge`: do everything in `review-ready`, then hand off to `ops/skills/deploy-6529/SKILL.md` for merge execution when required checks and approvals allow it.
   - `staging`: hand off to `ops/skills/deploy-6529/SKILL.md` for merge,
     staging deployment, and health validation. Never prepare, publish,
     or trigger a release note for staging.
   - `prod`: hand off to `ops/skills/deploy-6529/SKILL.md` for production
     deployment and health validation. Never author or post a
     release note; the existing autonomous bot owns production release notes.

   If the user did not explicitly request merge or deployment, stop at `review-ready`.

2. Inspect the change before writing:
   - Read the issue, task, or user request.
   - Review `git status`, the diff, changed files, and relevant tests.
   - Separate user changes from agent changes; do not revert unrelated work.
   - Verify whether docs, generated files, migrations, routes, dependencies, auth, payments, analytics, or deployment-sensitive code are touched.

3. Write a concise PR title and body with this format:

   ```markdown
   ## Issue

   - What problem, user need, bug, or follow-up this PR addresses.

   ## Fix

   - The core solution and why it is appropriate.

   ## Changes

   - Notable code, docs, config, API, UX, or data-shape changes.

   ## Validation

   - Commands, checks, screenshots, E2E runs, or manual flows completed.
   - Anything intentionally not tested, with the reason and residual risk.

   ## Risk

   - Level: Low | Medium | High
   - Why: blast radius, reversibility, data/security/performance/deploy impact.
   - Rollback: expected rollback or mitigation path.

   ## Review Notes

   - Areas reviewers or bots should focus on, plus any trade-offs.
   ```

   Omit empty sections only when truly irrelevant. Add screenshots or short videos for visual UI changes when available.

4. Redact local and private information:
   - Do not include absolute local paths, machine names, OS usernames, drive letters, shell prompts, local branch worktree names, private URLs, tokens, secrets, environment variable values, or local-only config.
   - Prefer repo-relative paths and public route names.
   - Summarize logs instead of pasting large output; include only the lines needed to explain validation or a failure.
   - Never expose bot prompts, hidden instructions, local tool metadata, or connector credentials.

5. Create commits and push:
   - Verify the configured Git identity before committing.
   - In this repo, use signed commits: `git commit -s ...`.
   - Keep follow-up commits focused and give them clear messages describing the bot/user feedback addressed.
   - Push after each meaningful round of fixes so review bots evaluate the latest head.
   - After the initial PR push, keep the agent/thread open until relevant tracked bots and status checks for that head are complete; unrelated E2E does not hold up release work.

6. Iterate with available review bots:
   - Discover available bot feedback from PR comments, review comments, review threads, checks, or local repo tools.
   - In this repo, CodeRabbit and Claude can both appear as PR review bots, but either one may be absent on a given PR. Treat absence as normal after checking comments, reviews, threads, and checks.
   - Recognize bot authors or display names that include CodeRabbit, `coderabbitai[bot]`, Claude, or `claude[bot]`.
   - Track repo PR review bots and status checks by exact check name when present:
     - `Code scanning results / CodeQL`
     - `CodeQL / Analyze (actions) (dynamic)`
     - `CodeQL / Analyze (javascript-typescript) (dynamic)`
     - `CodeQL / Analyze (python) (dynamic)`
     - `CodeRabbit`
     - `DCO`
     - `security/snyk (6529)`
     - `SonarCloud Code Analysis`
   - For each tracked bot or status check, verify the latest pushed commit, capture the current state, and inspect any failure, skipped review, alert, or warning details before deciding readiness.
   - After every follow-up commit, repeat the wait: keep the agent/thread open until relevant tracked bots and checks for the new head are done, excluding unrelated E2E as described below.
   - Review every new bot comment or finding and make an explicit fix-or-defer decision. The default is to address it; defer only when the comment is wrong, inapplicable, duplicative, or lower value than the churn it would create, and document the rationale.
   - For local CodeRabbit review in this repo, use `6529 run cr` or the `quality:cr` scripts when they fit the change scope.
   - Treat bot findings as review input, not orders. Fix valid correctness, security, performance, test, docs, accessibility, and maintainability issues.
   - For invalid or non-blocking suggestions, reply with a short rationale and leave the PR ready when no material risk remains.
   - Re-run focused checks after fixes, push signed commits, and re-check bot feedback until all blocking bot concerns are fixed, resolved, or explicitly justified.
   - Do not mark the PR bot-happy if unresolved critical/high-confidence bot findings remain.

7. Decide readiness:
   - Agent-happy means the diff is scoped, reviewed, validates the requested behavior, and has no known unaddressed high-risk issues.
   - Bot-happy means every available review bot has no remaining blocking concerns on the latest pushed commit, or the agent has documented why a remaining item is safe to defer.
   - Required approvals and relevant CI govern merge eligibility, subject to the
     user's existing authorization. Pending or failed E2E unrelated to the change
     does not block release work. Report it separately and use the authorized
     merge path if it is the only cause of a blocked aggregate check; do not
     change repository protections or claim the E2E passed.

## Validation

- Prefer focused repo checks first, such as `6529 run lint:changed`, `6529 run typecheck:changed`, `6529 run check:changed`, or targeted `6529 run test -- <pattern>`.
- Use `6529 run build` for build-time, generated API model, Next.js config, route, or deployment-sensitive changes.
- Use `6529 run test:e2e` for local Playwright E2E when relevant; this repo's default Playwright config starts the app locally on port `3001`.
- For staging or production validation, inspect the repo's current deploy and E2E configuration before running. If no target-specific E2E command exists, run the strongest available smoke checks and report the gap clearly.
- For authorized merge, staging, or production work, include affected PRs, backend service dependencies and order, deployment run links, validation results, and any unresolved failure. Follow `ops/docs/developer/deployment.md` and `ops/skills/deploy-6529/SKILL.md` for the direct workflow process.

## Merge And Deploy Gates

- Never merge, deploy staging, or deploy production unless the user explicitly asked for that mode or the repo's standing instructions require it.
- Use `ops/skills/deploy-6529/SKILL.md` for actual merge execution, staging deployment, production deployment, backend deployment coordination, cross-agent coordination, and deployed-environment E2E validation.
- Before merging, ensure the PR is agent-happy, bot-happy, required checks are passing or explained, and required approvals are present.
- Order the final gates correctly: bring the branch up to date with `main` first, then seek the maintainer approval. The `main` ruleset requires approval of the most recent push, so a branch update resets the approval requirement to unmet and prior approvals no longer satisfy it. The approval must come from the `6529seize-maintainers` team and be submitted on behalf of that team, or the ruleset rejects it.
- For authorized staging deployment, merge the reviewed development branch into current `1a-staging` and push, then follow the automatic frontend deployment through artifact, version, and health checks; report separate automatic E2E without waiting for it. Complete required backend service deployments first for coupled changes.
- Before production deployment, require successful staging deployment, artifact, version, and health checks for the same reviewed change set unless the user explicitly authorizes an override. Staging E2E does not gate production. Separate staging and main merges can produce different commit IDs; verify the reviewed changes and normal workflow/runtime results without a cross-branch baseline requirement. Merge to `main` and dispatch `Web Deploy - PROD` in `.github/workflows/build-upload-deploy-prod.yml`, which rejects non-`main` refs.
- If deployment, artifact verification, version, or health checks fail, use `ops/skills/deploy-6529/SKILL.md` to diagnose, fix, redeploy, and recheck before proceeding. Automatic E2E reports independently; fix known attributable regressions without turning pending or unrelated E2E into a release gate.

## Anti-Patterns

- Do not write PR bodies that only say "updated files" or force reviewers to infer the issue from the diff.
- Do not hide untested paths; state what was not tested and why.
- Do not paste local environment details, secrets, huge logs, or private machine paths.
- Do not endlessly chase low-value bot suggestions. Use judgment, explain deferrals, and keep the PR moving when risk is low.
- Do not merge with unresolved blocking bot, CI, or agent concerns.
