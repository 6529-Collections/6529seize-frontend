# Codex Workspace

The `/codex` directory is the shared operating hub for long-lived planning,
execution, and documentation artefacts. Treat it as the single source of truth
for everything that coordinates engineering work beyond the codebase.

## Directory Guide

- `STATE.md` – Ticket board of record. Every row must map to a file in
  `tickets/` and stay alphabetically sorted by ticket ID.
- `agents.md` – Deep dive on the Codex workflow, ticket lifecycle, and hygiene
  expectations for contributors.
- `tickets/` – Canonical ticket files (see `tickets/README.md` for the template
  and authoring rules). Keep ticket front matter in sync with `STATE.md`.
- `plans/` – Time-boxed planning artefacts (roadmaps, sprint briefs, demos).
  Refer to `plans/README.md` for naming conventions and required sections.
- `docs/` – Evergreen documentation archive (audits, incident reviews,
  architecture notes). Follow `docs/README.md` for metadata and retention
  guidance.

## Working Rhythm

1. **Read the board** – Start every session by reviewing `STATE.md` to confirm
   priorities, owners, and open PR links.
2. **Capture scope** – Open or update the matching file in `tickets/` using the
   provided template. Log context, plan, acceptance checks, and timestamped
   updates.
3. **Link PRs both ways** – Reference the ticket ID in your pull request and add
   the PR link back into the ticket file and `STATE.md`.
4. **Promote status forward** – Move tickets through `Backlog → In-Progress →
   Review → Done`. Avoid regressions without logging the rationale in the
   ticket.
5. **Archive durable knowledge** – When work produces reusable guidance, capture
   it in `docs/`. Group broader initiative notes inside `plans/` and link the
   relevant tickets.

## Quality Expectations

- Update the `Last Updated` column in `STATE.md` whenever ownership, status, or
  linked PRs change.
- Keep YAML front matter keys alphabetised (`created`, `id`, `owner`,
  `priority`, `status`, `title`) and use ISO 8601 dates.
- Log meaningful events in the ticket **Log** section with UTC timestamps so the
  history is auditable.
- Avoid editing tickets marked **Done**; instead, open a new ticket and cross
  reference it in the prior log.
- Scrub all secrets and personal data from documentation or link to an approved
  secure store when redaction is impossible.

## Quick Checklist Before Submitting Work

- [ ] Ticket file updated with context, plan progress, acceptance, and log entry.
- [ ] `STATE.md` row updated for status, priority, owner, PR links, and last
      touched date.
- [ ] Related plans or docs amended (or new files added) when broader context is
      needed.
- [ ] Pull request description references the ticket ID and summarises outcomes.

Keeping these artefacts consistent ensures reviewers can audit scope quickly,
trace decisions, and understand how code changes align with larger initiatives.
