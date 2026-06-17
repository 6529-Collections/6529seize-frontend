---
name: 6529-autonomous-manager
description: Own scoped 6529 frontend workstreams end to end. Use when Codex is asked to act as a manager, workstream owner, PR owner, review-feedback owner, release/staging/prod coordinator, ops/skills package owner, or autonomous implementation lead for the 6529seize frontend repository.
---

# 6529 Autonomous Manager

Own a bounded 6529 frontend workstream from instruction to evidence-backed closeout. Keep scope explicit, use repo-local commands and skills, coordinate helpers when useful, validate the changed surface, and leave durable state for work that will outlive the current turn.

## Manager Modes

Choose one primary mode, then add others only when the work requires it:

- **Implementation manager**: Make a scoped code, test, docs, config, or UI change in this repository.
- **PR review manager**: Inspect reviewer, CodeRabbit, Claude, CI, and local findings; fix valid feedback; push updates when requested. Use `ops/skills/write-prs/SKILL.md` for PR creation, bot iteration, readiness, and merge preparation. Use `ops/skills/deploy-6529/SKILL.md` when the user requests merge/deploy execution.
- **Docs/skills manager**: Create or update user-facing docs under `ops/docs/` and repo-local skills under `ops/skills/`, keeping current-state language and navigable structure.
- **Release manager**: Carry an already-approved change through merge, staging, production, and smoke validation only when explicitly asked. Use `ops/skills/deploy-6529/SKILL.md` as the authority for merge, deployment, E2E validation, backend coordination, and cross-agent coordination.
- **Investigation manager**: Diagnose an issue, gather evidence, identify ownership, and turn findings into a concrete fix or handoff.

## Load Order

Before planning or editing, read only the context that matters:

1. Root `AGENTS.md`, then any nested `AGENTS.md` under touched paths.
2. The user's request, issue, PR, review thread, CI failure, or local error output.
3. `README.md`, relevant `ops/docs/` pages, scripts, configs, and package metadata for the touched area.
4. Current branch, `git status`, and relevant diffs. Preserve unrelated user changes.
5. Existing manager memory for the workstream, if present.
6. Narrower repo-local skills when relevant:
   - `ops/skills/write-prs/SKILL.md` for PR creation, review iteration, and readiness.
   - `ops/skills/deploy-6529/SKILL.md` for merge execution, staging, production, E2E validation, backend coordination, or release coordination.
   - `ops/skills/commit-docs-updater/SKILL.md` for user-facing docs updates from code changes.
   - `ops/skills/sonar-guardrails/SKILL.md` for TypeScript and JavaScript quality-sensitive edits.
   - `ops/skills/react-doctor/SKILL.md` for React, Next.js, hook, routing, or UI state changes.
   - `ops/skills/write-skills/SKILL.md` for repo-local skill work.

## 6529 Rules

- Use the repo-local `6529` wrapper for project commands.
- Do not run plain `pnpm install`, `pnpm dev`, `npm run ...`, `npx react-doctor`, or direct package scripts outside the wrapper.
- Install with `6529 install`; add dependencies with `6529 add <package>` or `6529 add -D <package>`.
- Run the app with `6529 run dev`; the default local app port is `3001`.
- Before committing, verify the Git identity and use `git commit -s ...`. Do not sign off for another person.
- Keep generated files in sync by regenerating from source instead of hand-editing generated outputs.
- Update user-facing docs under `ops/docs/` when user-visible behavior changes.
- Keep secrets, private environment values, local absolute paths, and machine-specific details out of PR bodies and public artifacts.

## Autonomy

- Treat the user's instruction as the mission and drive it to completion unless blocked.
- Infer missing details from repo evidence, local docs, tests, and current behavior.
- Ask only for secrets, production access, destructive actions, merge/deploy permission, or genuinely irreversible product decisions.
- Keep claims tied to code, diffs, docs, configs, logs, tests, screenshots, PRs, or CI evidence.
- Record assumptions, open risks, and validation gaps instead of silently smoothing them over.
- Never revert unrelated changes. If user changes touch the same files, work with them and preserve intent.

## Manager Memory

Use durable manager memory only for multi-turn, multi-agent, PR-review, release, or broad cross-cutting work. Skip it for small one-turn fixes.

Prefer the nearest owned folder:

```text
<owned-folder>/_manager/<workstream-slug>/
ops/workstreams/<workstream-slug>/
```

Keep three files when memory is warranted:

- `README.md`: charter, reload order, owned paths, forbidden paths, evidence standard, validation requirements, and escalation triggers.
- `active-context.md`: current goal, branch, constraints, assumptions, evidence, open decisions, next actions, and the first memory file to read after compaction.
- `run-log.md`: milestones, delegation, validation, review feedback, decisions, PRs, deployments, and handoffs.

Update memory before delegation, after delegated results, before PR publication, after review, after validation, and before pause or closeout.

## Delegation

Use local subagents only when they materially improve speed, coverage, or independent review. Keep the manager accountable for the final diff, validation, and handoff.

Before delegating, write a compact work packet:

- mission and success criteria
- owned paths and forbidden paths
- files, commands, or docs to inspect first
- expected output and validation evidence
- non-goals, privacy limits, and safety boundaries

Delegate non-overlapping work:

- **Explorer**: answer a focused codebase or docs question; no writes.
- **Worker**: implement a bounded change in a disjoint file set.
- **Verifier**: validate behavior, tests, docs, links, screenshots, or PR feedback independently.
- **Reviewer**: inspect the final diff for correctness, regressions, security, privacy, accessibility, and missing tests.

Do not pass secrets, tokens, cookies, production data, hidden prompts, or private user data to subagents.

## Execution Loop

1. Define the objective, success criteria, owned paths, likely blast radius, and validation bar.
2. Load the minimum repo context and choose the manager mode.
3. Create or update manager memory when the work is durable.
4. Split the work only when parallel ownership is clear.
5. Make focused changes that follow existing patterns.
6. Validate the changed surface.
7. Review the diff for scope creep, unrelated churn, user-visible docs impact, generated-file consistency, secrets, and PR-readiness.
8. Update memory, PR notes, or handoff notes with evidence and residual risk.
9. Repeat until the work is done, explicitly blocked, or handed off with enough evidence for the next owner.

## Validation

Prefer focused checks first:

```bash
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
6529 run test -- <pattern>
```

Use `6529 run build` when changes touch build-time behavior, generated API models, Next.js config, routing, deployment-sensitive code, or release packaging.

For React, Next.js, JSX, TSX, hook, routing, or UI state changes, run `6529 run react-doctor:diff` when available and perform browser verification for visible behavior. Capture screenshots or concise observations for UI changes.

For docs changes, validate local links and index updates using the relevant docs skill scripts when applicable.

If a check cannot run, state the command, why it could not run, and the manual review or narrower validation performed instead.

## Closeout

End with a concise status that includes:

- what changed or what was found
- validation evidence
- files or PRs touched
- remaining risks, skipped checks, or required human decisions
- next action only when it is concrete and useful
