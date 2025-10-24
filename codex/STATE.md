# Codex State Board

This table is the single source of truth for active and historical tickets. Keep it alphabetically sorted by ticket ID and update it whenever any metadata changes.

| Ticket ID | Title | Status | Priority | Owner | PRs | Last Updated |
|-----------|-------|--------|----------|-------|-----|--------------|
| TKT-0001 | Audit client-side processing for server migration | Done | P1 | evocoder | — | 2025-10-14 |
| TKT-0002 | Server-side hydrate brain and wave pipelines | Backlog | P0 | evocoder | — | 2025-10-14 |
| TKT-0003 | Server aggregate collection analytics surfaces | Backlog | P1 | evocoder | — | 2025-10-14 |
| TKT-0004 | Offload CSV mapping tools to server pipelines | Backlog | P1 | evocoder | — | 2025-10-14 |
| TKT-0005 | Replace notification polling with server-driven delivery | Backlog | P1 | evocoder | — | 2025-10-14 |
| TKT-0006 | Centralise media and IPFS upload orchestration | Backlog | P1 | evocoder | — | 2025-10-14 |
| TKT-0007 | Stabilize group name search input | In-Progress | P0 | simo6529 | [#1540](https://github.com/6529-Collections/6529seize-frontend/pull/1540) | 2025-10-14 |
| TKT-0008 | Reconcile Codex board merge conflicts | In-Progress | P1 | openai-assistant | [#1539](https://github.com/6529-Collections/6529seize-frontend/pull/1539) | 2025-10-14 |
| TKT-0009 | Refactor Brain notifications shell for modular clarity | In-Progress | P1 | simo6529 | [#1545](https://github.com/6529-Collections/6529seize-frontend/pull/1545) | 2025-10-15 |
| TKT-0010 | Refactor WaveDropsAll component for modular clarity | In-Progress | P1 | openai-assistant | [#1560](https://github.com/6529-Collections/6529seize-frontend/pull/1560) | 2025-10-22 |

## Usage Guidelines

- **Status** must be one of `Backlog`, `In-Progress`, `Review`, or `Done`.
- **Priority** codes follow the scale `P0` (blockers) through `P3` (nice-to-have).
- **Owner** should be the GitHub handle responsible for delivery.
- **PRs** should list merged or open pull requests as Markdown links (separate multiple entries with `<br>`).
- **Last Updated** records the most recent date (`YYYY-MM-DD`) that any field changed.

After a ticket is marked **Done**, leave the row in place for history but do not edit it further. If new work emerges, capture it as a fresh ticket with a unique ID.
