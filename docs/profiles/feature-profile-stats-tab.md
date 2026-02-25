# Profile Stats Tab

## Overview

The `Stats` tab shows collection and activity metrics for a profile. Users can
view consolidated numbers across all wallets or scope the view to one wallet.

## Location in the Site

- Route: `/{user}/stats`
- Related query parameters:
  - `address=<wallet>`: filter metrics to a single wallet
  - `activity=wallet-activity|distributions|tdh-history`: choose the lower
    activity section
  - `wallet-activity=all|airdrops|mints|sales|purchases|transfers|burns`:
    filter wallet transactions
  - `page=<n>`: pagination for wallet activity and distributions

## Entry Points

- Open `/{user}/stats` directly.
- Switch to the `Stats` tab from another profile tab.
- Open a shared stats deep link that includes query parameters.

## User Journey

1. Open a profile stats route.
2. Initial summary blocks (`Tags`, `Collected`, `Activity Overview`, and `Boost
   Breakdown`) load with the best available route-load snapshot.
3. Optionally choose a wallet in the `Address` dropdown (`All Addresses` or a
   specific wallet).
4. Review summary sections:
   - tags (collection highlights)
   - `Collected` tables
   - `Activity Overview` tables
5. Switch between lower activity sections (`Wallet Activity`, `Distributions`,
   `TDH History`).
6. In `Wallet Activity`, review the relative timestamp shown on each
   transaction row (for example `3 minutes ago`); on desktop hover, the same
   label shows a full local date/time tooltip.
7. Keep the tab open to see wallet-activity relative timestamps refresh
   automatically every minute without a page reload.
8. Share the resulting URL to preserve current tab/filter context.

## Common Scenarios

- Compare all-wallet stats vs a single wallet by toggling `address`.
- Open `/{user}/stats` and start reading summary sections immediately while
  lower activity tables continue loading.
- Filter wallet activity by event type (Airdrops, Mints, Sales, Purchases,
  Transfers, Burns).
- Click the same wallet-activity filter again to reset back to `All`.
- Use pagination to browse older transactions or distributions.
- Use `Wallet Activity` relative time labels for quick recency checks, then
  hover a timestamp to confirm exact local date/time.
- Open `Boost Breakdown -> TDH Version: 1.4` to jump directly to
  `/network/tdh#tdh-1-4` when reviewing boost logic.

## Edge Cases

- If `address` is invalid or not one of the profile wallets, stats fall back to
  all-address behavior.
- Missing or zero numeric values are rendered as `-` in stats tables.
- Very recent wallet-activity rows show `Just now` until the next minute-level
  refresh.
- `Boost Breakdown` is shown only when boost breakdown data is available.
- If a full collection-set boost is already acquired, `Boost Breakdown` can
  show only the top-level collection row instead of per-season rows.
- When per-season rows are shown, available season entries can expand over time
  (for example, through `SZN12`) as TDH breakdown data evolves.
- `TDH History` can show `No TDH history found` when history is unavailable.

## Failure and Recovery

- Wallet Activity can show filter-specific empty states such as `No
  transactions` or `No sales`.
- Distributions can show `No distributions found`.
- If route-load summary snapshots are unavailable, the same summary sections can
  briefly show placeholder values before client-side retries complete.
- If wallet-activity relative time labels appear stale after the tab has been
  inactive for a while, staying on the page for up to one minute or refreshing
  the page resynchronizes the displayed ages.
- If summary fetches fail, summary tables remain visible with placeholder values
  (for example `-`); refreshing retries requests.

## Limitations / Notes

- The `page` query parameter is shared by wallet activity and distributions.
- Changing the lower `activity` tab resets wallet-activity filter and paging
  params.
- Wallet-activity relative timestamps update on a one-minute cadence (not
  second-by-second).
- Canonical-handle redirects keep query parameters, so deep links remain
  shareable after handle normalization.
- The boost-reference link targets the `TDH 1.4` section anchor on
  `/network/tdh`.

## Related Pages

- [Profiles Index](README.md)
- [Profile Header Summary](feature-profile-header-summary.md)
- [Profile Tabs](feature-profile-tabs.md)
- [Profile Tab Content](feature-profile-tab-content.md)
- [TDH Boost Rules](../network/feature-tdh-boost-rules.md)
- [Network Definitions](../network/feature-network-definitions.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Profile Navigation Flow](flow-profile-navigation.md)
- [Profile Troubleshooting](troubleshooting-profile-pages.md)
