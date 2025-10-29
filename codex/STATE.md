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
| TKT-0010 | Refactor WaveDropsAll component for modular clarity | In-Progress | P1 | openai-assistant | [#1560](https://github.com/6529-Collections/6529seize-frontend/pull/1560) | 2025-10-29 |
| TKT-0011 | Restore identity search keyboard navigation | Done | P1 | simo6529 | Pending (branch block-add-identity-to-wave) | 2025-10-26 |
| TKT-0012 | Refactor wave group edit buttons for modular clarity | In-Progress | P1 | openai-assistant | [#1544](https://github.com/6529-Collections/6529seize-frontend/pull/1544) | 2025-10-26 |
| TKT-0013 | Respect unstyled flag in compact menu button | In-Progress | P1 | openai-assistant | — | 2025-10-23 |
| TKT-0014 | Replace wave publish wait with backend confirmation | Backlog | P1 | openai-assistant | — | 2025-10-24 |
| TKT-0015 | Unify header search results | In-Progress | P1 | openai-assistant | [#1567](https://github.com/6529-Collections/6529seize-frontend/pull/1567) | 2025-10-24 |
| TKT-0016 | Upgrade Next.js app to version 16 | In-Progress | P0 | openai-assistant | — | 2025-10-27 |
| TKT-0017 | Stabilize Waves modal tests for app routing | In-Progress | P1 | openai-assistant | — | 2025-10-27 |
| TKT-0018 | Clean up UrlGuardHooks export | In-Progress | P1 | openai-assistant | — | 2025-10-28 |
| TKT-0019 | Make Wave card fully clickable | In-Progress | P1 | openai-assistant | — | 2025-10-27 |
| TKT-0020 | Harden CustomTooltip positioning robustness | In-Progress | P1 | openai-assistant | — | 2025-10-28 |
| TKT-0021 | Restore Discover create wave modal | In-Progress | P1 | openai-assistant | — | 2025-10-29 |
| TKT-0022 | Remove unused BrainLeftSidebarSearchWave dropdown | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0023 | Remove unused HeaderMobileUtils utilities | In-Progress | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0024 | Remove unused HeaderUserProfile component | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0025 | Remove unused WalletConnectionError export | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0026 | Remove unused DropListItemContentPart export | In-Progress | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0027 | Remove unused isMintDayDate helper export | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0028 | Remove unused getCollectionBaseBreadcrums export | In-Progress | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0029 | Remove unused immediatelyNextMintInstantUTC helper | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0030 | Remove unused getNextMintNumber helper | In-Progress | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0031 | Remove unused getPageMetadata helper | In-Progress | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0032 | Remove unused hasMetadataContent export | In-Progress | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0033 | Remove unused createIcsDataUrl helper | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0034 | Remove unused findLightDropBySerialNoWithPagination helper | Review | P2 | openai-assistant | — | 2025-10-28 |
| TKT-0035 | Add Discover link to app sidebar navigation | In-Progress | P1 | openai-assistant | — | 2025-10-29 |

## Usage Guidelines

- **Status** must be one of `Backlog`, `In-Progress`, `Review`, or `Done`.
- **Priority** codes follow the scale `P0` (blockers) through `P3` (nice-to-have).
- **Owner** should be the GitHub handle responsible for delivery.
- **PRs** should list merged or open pull requests as Markdown links (separate multiple entries with `<br>`).
- **Last Updated** records the most recent date (`YYYY-MM-DD`) that any field changed.

After a ticket is marked **Done**, leave the row in place for history but do not edit it further. If new work emerges, capture it as a fresh ticket with a unique ID.
