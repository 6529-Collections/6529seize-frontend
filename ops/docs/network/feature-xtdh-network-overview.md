# xTDH Network Overview

Parent: [Network Index](README.md)

## Overview

`/xtdh` is the live xTDH allocations dashboard.
It shows network-wide xTDH stats, then lets users drill down:
`Collections -> Tokens -> Contributors -> Grant details`.

## Location in the Site

- Route: `/xtdh`
- Sidebar path (web and app): `Network -> xTDH`
- Mobile navigation treats `/xtdh` as part of `Network`

## URL State

The route reads these query params:

- `xtdh_received_sort=xtdh|xtdh_rate` (default `xtdh`)
- `xtdh_received_dir=asc|desc` (default `desc`)
- `xtdh_received_contract=<contract>`
- `xtdh_received_tokens_sort=xtdh|xtdh_rate` (default `xtdh`)
- `xtdh_received_tokens_dir=asc|desc` (default `desc`)
- `xtdh_token_contrib_sort=xtdh|xtdh_rate` (default `xtdh`)
- `xtdh_token_contrib_dir=asc|desc` (default `desc`)
- `xtdh_token_contrib_group=grant|grantor` (default `grant`)

Notes:

- Invalid sort/direction/group values fall back to defaults.
- Default values are usually omitted from the URL.
- `xtdh_received_contract` is normalized to lowercase.

## Entry Points

- Open `/xtdh` directly.
- Open `Network -> xTDH` from the sidebar.
- Open a saved deep link with `xtdh_received_contract` and sort/group params.

## User Journey

1. Open `/xtdh`.
2. Review top cards: `Multiplier`, `xTDH Rate`, and `Granted`.
3. In `xTDH Collections`, search or sort collections.
4. Select a collection card to open `xTDH Tokens` for that contract.
5. Select a token to open contributor rows.
6. Switch contributor sort and `Group by` (`By Grant` or `By Grantor`).
7. Select a contributor row with a grant ID to open grant details.
8. Use `Back` controls to return to contributors, tokens, or collections.

## Page States

- Stats loading: top cards render skeleton placeholders.
- Collections loading: collections list renders skeleton rows.
- Collections empty: `No collections found`.
- Tokens empty: `No individual token allocations were returned for this collection.`
- Contributors empty: `No by grant data was returned for this token.` or
  `No by grantor data was returned for this token.`
- If a selected contract is not found in loaded collection metadata, the token
  view still opens and shows `Collection summary unavailable.`

## Failure and Recovery

- Stats failure: `Unable to load xTDH stats` with `Retry`.
- Collections first-load failure: `Failed to load received collections.` with `Retry`.
- Tokens first-load failure: `Failed to load received tokens.` with `Retry`.
- Contributors first-load failure: `Failed to load contributors.` with `Retry`.
- Grant details failure: `Failed to load grant details.` with `Retry`.
- Load-more failure keeps current rows and shows inline retry.

## Edge Cases

- `/xtdh` is a live dashboard. `/network/xtdh` is a static rules page.
- `/xtdh` stays a top-level route even though navigation groups it under
  `Network`.
- Wallet/identity is not required on `/xtdh`; it always runs in ecosystem scope.
- Search text is local UI state and is not stored in URL.
- Selected token and selected grant are local UI state and reset on refresh.
- Deep links persist collection and sort/group state, but not token/grant
  selection.

## Limitations / Notes

- `/xtdh` is read-only. Grant creation/editing is handled on profile xTDH
  routes.
- Metrics and lists come from live backend calculations and can change between
  refreshes.
- Deep links support collection + sort/group state, not token/grant detail
  state.

## Related Pages

- [Network Index](README.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Stats](feature-network-stats.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
