# Network Nerd Leaderboard

Parent: [Network Index](README.md)

## Overview

`/network/nerd` is the alternate read-only Network leaderboard.
It has two focus modes:

- `Cards Collected` (default)
- `Interactions`

## Location in the Site

- Route family: `/network/nerd/{focus?}`
- Focus links:
  - `/network/nerd` and `/network/nerd/cards-collected` open `Cards Collected`
  - `/network/nerd/interactions` opens `Interactions`
- Path parsing rule: only the first optional segment is used as focus.
- Sidebar path: none (open from `/network`)
- Query params: none for this route state

## Entry Points

- Open `/network`, then select `Nerd view`.
- Open `/network/nerd` directly.
- Open a shared focus link:
  - `/network/nerd/cards-collected`
  - `/network/nerd/interactions`

## User Journey

1. Open `/network/nerd`.
2. Pick `Cards Collected` or `Interactions`.
3. (Optional) set `Collectors`, `Collection`, `SZN`, and wallet search filters.
4. Sort, paginate, and download rows.
5. Open a collector profile from any row.

## Controls and State

- Switching focus updates the path with client-side `replace` navigation (no full page reload).
- Focus switch paths:
  - `Cards Collected` -> `/network/nerd/cards-collected`
  - `Interactions` -> `/network/nerd/interactions`
- `Collectors`, `Collection`, `SZN`, wallet search, sort, and page are local UI state (not in URL).
- `SZN` is enabled only when `Collection` is `Memes`, or `Collectors` is `Memes` or `Meme SZN Set`.
- Leaving those memes filters resets `SZN` back to `All`.
- Wallet search tokens are shared across both focus modes.
- Switching focus remounts the active table, so each focus returns to default sort/page.

## Data and Display Behavior

- Header stats show:
  - latest TDH block (linked to Etherscan)
  - network TDH
  - daily network change
- `Cards Collected` columns: level, cards collected, unique memes, sets, TDH,
  daily change, and vs-network ratio.
- `Interactions` columns are grouped into primary purchases, secondary
  purchases, sales, and transfers.
- Collector cells link to profile routes.
- Pagination appears only when results exceed `50`.
- Download actions:
  - `Download Page` exports the current page.
  - `Download All Pages` exports the full filtered result set.
- Download file names use the `network-interactions` prefix in both focus modes.

## Edge Cases

- Unknown focus values fall back to `Cards Collected`.
- Unknown focus URLs are not rewritten until the focus control is used.
- Extra path segments after the first are ignored.
- This route has no group-scope controls and does not expose `/network` group filtering.
- Focus links are shareable, but non-focus UI state (filters/search/sort/page) is not.

## Loading, Empty, Error, Recovery

- A top-row spinner shows while leaderboard requests are running.
- Empty responses show: `No results found. Change filters and try again.`
- No inline error banner or retry button is shown for leaderboard requests.
- If latest TDH block fetch fails, the header stats block is hidden.
- Recovery steps:
  - Refresh `/network/nerd`.
  - Clear search tokens and reset dropdowns to `All`.
  - Switch focus and retry.
  - Reopen from `/network` -> `Nerd view`.

## Constraints / Notes

- Read-only route; no mutation actions.
- Table page size is fixed to `50`.

## Related Pages

- [Network Index](README.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
