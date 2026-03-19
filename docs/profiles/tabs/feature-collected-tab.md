# Collected Tab, Stats Summary, and Transfer Mode

## Overview

The `Collected` tab at `/{user}/collected` combines profile holdings browsing
with an integrated stats summary and an expandable details panel.

It has two top-level views:
- `Native`: profile card holdings for The Memes, Gradients, NextGen, and Meme Lab.
- `Network`: xTDH token holdings by contract.

The top stats block stays on this route in both views.
`Details` expands holdings totals, activity overview, wallet activity,
distributions, TDH history, and boost breakdown.

Transfer mode is part of the Native collected view (not a separate route).

## Location in the Site

- Route: `/{user}/collected`
- Query parameters:
  - `address=<wallet>`: scope collected results and the stats summary/details
    to one wallet. Missing value uses all profile wallets.
  - `collection=<memes|gradients|nextgen|memelab|network>`
  - `subcollection=<contract-address>`: Network-only collection filter.
  - `seized=<seized|not_seized>`: Memes-only filter.
  - `szn=<season-id>`: Memes-only season filter.
  - `sort-by=<token_id|tdh|rank|xtdh|xtdh_day>`
  - `sort-direction=<asc|desc>`
  - `activity=wallet-activity|distributions|tdh-history`: Details-panel lower
    section. Missing or unknown values default to `wallet-activity`.
  - `wallet-activity=all|airdrops|mints|sales|purchases|transfers|burns`:
    Wallet Activity filter. Missing or unknown values default to `all`.
  - `page=<n>`: current page for the active paginated section on this route.

## Entry Points

- Open `/{user}/collected` directly.
- Click `TDH` in the profile header stats row.
- Switch to `Collected` from another profile tab.
- Open a shared collected deep link with query parameters.

## User Journey

1. Open `/{user}/collected`.
2. Review the top stats block:
   - headline metrics can include `NextGen`, `Meme Sets`, `Memes`,
     `Gradients`, and `Boost`
   - `Seasons` tiles show started Meme seasons, complete-set counts, and
     progress toward the next set
   - unopened Meme seasons can appear as `Unseized` chips
3. Click `Details` to expand the integrated stats panel.
4. In `Details`, review:
   - `Collected` totals and per-season Meme tables
   - `Activity Overview`
   - lower section tabs: `Wallet Activity`, `Distributions`, `TDH History`
   - `Boost Breakdown`
5. Choose `View`:
   - `Native` for profile card holdings.
   - `Network` for xTDH token holdings.
6. Apply filters:
   - Native collection: `All`, `The Memes`, `Gradients`, `NextGen`, `Meme Lab`.
   - Network collection: contract list from current xTDH collections.
   - Memes-only filters: `Seized` and `Season`.
   - Address filter (`All Addresses` or one wallet) is available in native view.
7. Apply sort and browse pages.
8. In native view (outside transfer mode), open token routes from cards:
   - `/the-memes/{id}`, `/6529-gradient/{id}`, `/nextgen/token/{id}`, `/meme-lab/{id}`.
9. If transfer is available, click `Transfer`:
   - cards switch from links to selection controls
   - ERC-1155 cards support quantity selection
   - ERC-721 cards are single-select
10. Use the sticky transfer panel to review selection and continue.

## Common Scenarios

- Compare consolidated holdings (`All Addresses`) against one wallet (`address=...`).
- Open `Details` and switch between `Wallet Activity`, `Distributions`, and
  `TDH History`.
- Check how many full Meme sets exist and how far the active season is from the
  next set.
- Filter Memes by season and clear back to `All Seasons`.
- Switch to `Network` to inspect per-token `xTDH` and `xTDH/day`.
- Keep a transfer selection while changing pages or filters.

## Edge Cases

- The top stats block still renders on `Network`; if an `address` query is
  already present, it continues to scope both the stats block and Network
  results even though the address dropdown is hidden there.
- `Details` can open even when summary metrics are sparse; if the profile cannot
  produce a stats scope, the panel shows `Stats are unavailable for this profile.`.
- The `Seasons` strip is hidden when there are no started Meme seasons.
- On desktop, the started-season row can collapse behind `+N more`; on
  touch/mobile, seasons stay horizontally scrollable.
- `page` is reused by the main collected list and the paginated details tables
  on this route.
- Clicking another profile tab keeps only `address` and drops collected-specific
  filters plus `activity`, `wallet-activity`, and `page`.
- Transfer controls are hidden when:
  - screen is mobile,
  - connected wallet is not one of the profile wallets,
  - current native page has no cards.
- If `szn` does not match an available season, the UI stays on `All Seasons`.
- Cards can show `Not owned by your connected wallet` in transfer mode when the
  current result set includes cards from other profile wallets.
- Selecting the same sort field toggles sort direction.
- Switching collection/view resets page and clears incompatible filters/sort.

## Failure and Recovery

- Initial load shows skeleton placeholders.
- If native collected data fails, the tab falls back to empty-state copy
  (for example `No cards to display`).
- If network token data fails, network cards can fall back to `No tokens found`.
- Inside `Details`:
  - Wallet Activity empty states are filter-specific (`No transactions`,
    `No sales`, `No burns`, and similar).
  - Distributions empty state: `No distributions found`.
  - TDH History empty state: `No TDH history found`.
  - Summary tables can stay visible with placeholder values such as `-` when
    data is missing.
- If transfer-balance data fails, cards can appear not selectable in transfer mode;
  exit transfer mode and retry.
- If wallet connection is lost during transfer mode, transfer mode closes and
  selection is cleared.
- If route/profile resolution fails before render, shared not-found behavior applies:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)

## Limitations / Notes

- There is no standalone `/{user}/stats` route. Use `/{user}/collected` and
  `Details` for profile stats behavior.
- `Seized` and `Season` controls appear only when `Collection` is `The Memes`.
- Network cards are informational in this tab and do not open token detail routes.
- Transfer mode uses the connected wallet's transferable balance, not consolidated
  profile balance.
- Transfer execution details are documented in:
  [NFT Transfer](../../media/nft/feature-transfer.md)

## Related Pages

- [Profiles Index](../README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profiles Tabs Index](README.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [NFT Transfer](../../media/nft/feature-transfer.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
