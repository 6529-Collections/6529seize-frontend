# Profile Stats Tab

## Overview

The `Stats` tab at `/{user}/stats` shows profile holdings/activity summaries,
wallet activity history, distribution history, TDH history, and boost details.

## Location in the Site

- Route: `/{user}/stats`
- Tab label: `Stats`
- Canonical-handle redirects keep query parameters.

## Query Parameters

- `address=<wallet>`
  - Valid address: scopes stats/activity requests to that wallet.
  - Invalid address: falls back to all-profile-wallet scope.
  - A valid URL address still works even if it is not in the dropdown list.
- `activity=wallet-activity|distributions|tdh-history`
  - Chooses the lower section.
  - Missing/unknown value defaults to `wallet-activity`.
  - Switching `activity` clears `wallet-activity` and `page`.
- `wallet-activity=all|airdrops|mints|sales|purchases|transfers|burns`
  - Filters wallet transactions.
  - Missing/unknown value defaults to `all`.
  - Clicking the active filter again resets to `all`.
- `page=<n>`
  - Shared by wallet activity and distributions.
  - Missing/non-numeric value defaults to `1`.
  - Out-of-range value is corrected to a valid page (or `1` when no rows).

## User Journey

1. Open `/{user}/stats` directly or switch to the `Stats` tab.
2. Review top sections:
   - `Tags` (rendered only when tag data exists)
   - `Collected`
   - `Activity Overview`
3. Optional: pick an address in the `Address` dropdown.
4. Switch the lower section between `Wallet Activity`, `Distributions`, and
   `TDH History`.
5. In `Wallet Activity`:
   - filter by event type
   - review action text, counterparty profile link, ETH value (when present),
     gas/royalty indicators, etherscan link
   - open supported token routes: `/the-memes/{id}`, `/meme-lab/{id}`,
     `/nextgen/token/{id}`, `/6529-gradient/{id}`
6. In `Distributions`, review collection/token rows, wallet, phase columns,
   minted/total counts, and pagination.
7. In `TDH History`, review charts or `No TDH history found`.
8. If shown, review `Boost Breakdown` and open `TDH Version: 1.4` to
   `/network/tdh#tdh-1-4`.

## States and Recovery

- First-load skeletons can appear in `Wallet Activity`, `Distributions`, and
  `TDH History`.
- Wallet Activity empty states are filter-specific (`No transactions`,
  `No sales`, `No burns`, and similar).
- Distributions empty state: `No distributions found`.
- TDH History empty state: `No TDH history found`.
- Summary tables stay visible with placeholder values (`-`) when fields are
  missing; refresh retries failed requests.
- Wallet Activity timestamps update every minute. Hovering the timestamp shows
  exact local time.

## Edge Cases

- Very recent wallet-activity rows can show `Just now`.
- `TDH History` uses the profile consolidation key and is not scoped by
  `address`.
- TDH history charts with only zero values are hidden.
- `Boost Breakdown` renders only when boost breakdown data and a boost value are
  present.
- If full collection-set boost is already acquired, the Memes section can show
  only the top-level collection row.
- Memes/MemeLab rows can render before metadata resolves; label/image detail can
  be temporarily limited.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Pagination Controls](../../shared/feature-pagination-controls.md)
- [TDH Boost Rules](../../network/feature-tdh-boost-rules.md)
- [Network Definitions](../../network/feature-network-definitions.md)
