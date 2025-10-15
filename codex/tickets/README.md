# Codex Ticket Authoring Guide

Each ticket is stored as a Markdown file in this directory with the filename `<ticket-id>.md` (for example, `TKT-1234.md`). The file begins with YAML front matter followed by structured sections that capture context, plan, acceptance, links, and a running log.

## Front Matter Template

```yaml
---
created: 2024-01-15
id: TKT-1234
owner: octocat
priority: P1
status: In-Progress
title: Upgrade authentication flow
---
```

Set `owner` to the assignee's GitHub handle. When the handle is not available yet, use `owner: unknown` and correct it before logging work.

- Use ISO 8601 dates for `created`.
- Keep keys in alphabetical order.
- `status` must match the values used in `codex/STATE.md`.
- `priority` is one of `P0`, `P1`, `P2`, or `P3`.

## Body Outline

```markdown
## Context

Briefly describe the problem space and why the work matters.

## Plan

- [ ] Step or milestone
- [ ] Another step

## Acceptance

- [ ] Condition or test that confirms success

## Links

- Primary PR: _(add a Markdown link when created)_
- Follow-ups: _(list future tickets or TODOs)_

## Log

- 2024-01-15T10:42:00Z – Initial draft created, awaiting estimation.
```

### Best Practices

- Keep the plan checklist current; mark completed items with `[x]` and expand with sub-steps when scope changes.
- Add timestamps to every log entry in UTC using the `YYYY-MM-DDThh:mm:ssZ` format.
- Record notable decisions, blockers, escalations, and validations in the log to build an auditable history.
- When opening a PR, link it in both the **Links** section and the corresponding row in `codex/STATE.md`.
- If work is descoped or postponed, document the reasoning in the log before updating the status or priority.
