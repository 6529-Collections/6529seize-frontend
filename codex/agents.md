# Codex Workspace Overview

The `/codex` directory centralises planning artefacts so work can be tracked and audited without relying on external tools. Every ticket progresses through a shared lifecycle that keeps the board, ticket logs, and pull requests synchronised.

## Workflow Fundamentals

- **Open a ticket**: Create a new Markdown file under `codex/tickets/` using the ticket template. Assign a unique ID that matches the filename (`ticket-ID.md`) and choose an initial priority (P0–P3).
- **Register the ticket**: Add a row to `codex/STATE.md` capturing the ticket metadata. The table is the authoritative board and must mirror the ticket front matter.
- **Deliver incremental work**: Keep updates small, land pull requests frequently, and cross-reference the ticket in PR descriptions.
- **Maintain the board**: Whenever the status, owner, linked PRs, or priority changes, update both the ticket front matter and the `STATE.md` row.
- **Close the loop**: Before marking a ticket **Done**, verify the acceptance criteria, ensure linked PRs are merged, and capture the final log entry.

## Directory Layout

- `/codex/STATE.md`: Master board of tickets, tracked as a Markdown table. Every ticket ID listed here must have a matching file in `codex/tickets/`.
- `/codex/tickets/`: Canonical ticket records with context, plan, acceptance checks, PR links, and chronological log entries.
- `/codex/plans/`: Time-boxed planning documents (for example, sprint briefs) that roll tickets into broader initiatives and demos.

> Tip: Avoid editing tickets marked **Done**—append follow-up work as a new ticket to keep historical artefacts immutable.

## Ticket Status Lifecycle

Tickets use one of the four Codex statuses:

- **Backlog** – Defined work that is not yet being executed.
- **In-Progress** – Active engineering work; log meaningful events daily.
- **Review** – Waiting on pull request review, sign-off, or external validation.
- **Done** – Ticket verified, acceptance criteria satisfied, no further work expected.

Only move a ticket forward (never backwards) unless there is an explicit reset of scope. When rolling back, add a log entry explaining the decision.

## Board Hygiene Expectations

- Update the `Last Updated` column every time a ticket changes state, owner, or linked PRs.
- Use GitHub handles for the **Owner** column to line up with PR mentions.
- Track PR references as Markdown links (e.g. `[PR #123](https://github.com/org/repo/pull/123)`).
- Leave placeholder rows out of the board—`STATE.md` should only list active or historical tickets.

## Ticket Authoring Standards

- Maintain the YAML front matter in alphabetical key order: `created`, `id`, `owner`, `priority`, `status`, `title`.
- Use ISO 8601 dates (`YYYY-MM-DD`) for `created` and timestamps in the log.
- Keep the **Plan** section as a living checklist; strike through or mark completed items with `[x]`.
- Capture risks, external dependencies, and decisions in log entries so reviewers can audit the timeline.

## Planning Documents

Planning files in `codex/plans/` should:

- Follow the naming convention `YYYYWW-name.md` (calendar week) or `YYYY-QN-name.md` for quarterly plans.
- Document the planning window, goals, committed tickets, stretch objectives, demo notes, and retro actions.
- Link back to ticket IDs and keep status snapshots so stakeholders can see progression across the time box.

## Codex Agent Contract

Codex agents working in this repository must:

1. Read `codex/STATE.md` before beginning new work to avoid conflicts.
2. Log every material action or decision in the ticket's **Log** section with timestamped bullet notes.
3. Keep ticket files and `STATE.md` in sync for status, priority, ownership, and PR references.
4. Never modify tickets marked **Done**—open a follow-up ticket instead.
5. Ensure every merged PR references its ticket ID and that the ticket references the PR.

By keeping the board, tickets, and plans tightly aligned, contributors maintain a single source of truth that scales across teams and long-running initiatives.
