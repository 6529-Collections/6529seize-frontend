# Codex Documentation Archive

This folder stores long-lived documentation that supplements the ticket board without depending on an active ticket. Use it for artefacts that must remain discoverable after day-to-day execution wraps up.

## When to Add Documents

- Code audits that capture review scope, findings, and remediation follow-up.
- Architecture or design narratives that influence multiple tickets or future initiatives.
- Incident, postmortem, or compliance reports that require durable retention.
- Runbooks, checklists, and operational guides that should persist beyond a single sprint.

## Authoring Guidelines

- Name files `<YYYY-MM-DD>-short-topic.md` so they sort chronologically.
- Start with a one-paragraph summary and link any related tickets or pull requests.
- Note owners and review cadence where relevant so stakeholders know how to keep the document current.
- Update documents in place; if a document is superseded, link to the replacement instead of deleting history.

## Cross-Referencing

- Reference these documents from the relevant tickets, plans, or README sections.
- Record material decisions or commitments inside the associated ticket log so timelines stay auditable.
