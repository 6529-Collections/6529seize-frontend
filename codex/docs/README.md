# Codex Documentation Archive

This folder stores long-lived documentation that supplements the ticket board without depending on an active ticket. Use it for artefacts that must remain discoverable after day-to-day execution wraps up.

## When to Add Documents

- Code audits that capture review scope, findings, and remediation follow-up.
- Architecture or design narratives that influence multiple tickets or future initiatives.
- Incident, postmortem, or compliance reports that require durable retention.
- Runbooks, checklists, and operational guides that should persist beyond a single sprint.
- Security-sensitive write-ups that need long-term traceability—ensure they are scrubbed of secrets, credentials, tokens, or other production keys.
- Any artefact containing regulated or personal data must be anonymised or redacted; when redaction is not possible, stash the source in the approved confidential store and link to it with access notes.
- If a document has audience or retention constraints, call them out explicitly (for example, `internal-only`, `retain 12 months`).

## Authoring Guidelines

- Name files `<YYYY-MM-DD>-short-topic.md` so they sort chronologically.
- Start with a one-paragraph summary and link any related tickets or pull requests.
- Note owners and review cadence where relevant so stakeholders know how to keep the document current.
- Update documents in place; if a document is superseded, link to the replacement instead of deleting history.
- Add YAML front matter at the top of every file to align ownership and lifecycle metadata:

```yaml
---
title: Short Topic
date: YYYY-MM-DD
owner: @github-handle
review_cadence: quarterly
status: active # active | superseded | deprecated
related:
  tickets: [T-123, T-456]
  prs: [https://github.com/org/repo/pull/1234]
superseded_by: 2025-07-01-new-guidance.md # optional
audience: internal-only # optional
---
```

## Cross-Referencing

- Reference these documents from the relevant tickets, plans, or README sections.
- Record material decisions or commitments inside the associated ticket log so timelines stay auditable.
- Include a **Backlinks** section at the end of each document listing the related tickets, PRs, or plans so reviewers can traverse context quickly.
- Keep an `INDEX.md` in this directory (grouped by year or topic) when the archive grows; the index should point to the most important or frequently referenced documents.
