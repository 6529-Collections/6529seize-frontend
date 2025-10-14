# Codex State Board

This table is the single source of truth for active and historical tickets. Keep it alphabetically sorted by ticket ID and update it whenever any metadata changes.

| Ticket ID | Title | Status | Priority | Owner | PRs | Last Updated |
|-----------|-------|--------|----------|-------|-----|--------------|
| TKT-0001 | Audit client-side processing for server migration | Review | P1 | evocoder | — | 2025-10-14 |
| TKT-0002 | Stabilize group name search input | In-Progress | P0 | simoluts | [#1540](https://github.com/6529-Collections/6529seize-frontend/pull/1540) | 2025-10-14 |

## Usage Guidelines

- **Status** must be one of `Backlog`, `In-Progress`, `Review`, or `Done`.
- **Priority** codes follow the scale `P0` (blockers) through `P3` (nice-to-have).
- **Owner** should be the GitHub handle responsible for delivery.
- **PRs** should list merged or open pull requests as Markdown links (separate multiple entries with `<br>`).
- **Last Updated** records the most recent date (`YYYY-MM-DD`) that any field changed.

After a ticket is marked **Done**, leave the row in place for history but do not edit it further. If new work emerges, capture it as a fresh ticket with a unique ID.
