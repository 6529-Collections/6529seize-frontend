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
  - `sort-direction=<asc|desc>`: shared links can omit the default active sort
    (`token_id desc` in Native, `xtdh desc` in Network).
  - `activity=wallet-activity|distributions|tdh-history`: Details-panel lower
    section. Any present value opens `Details` on first render. Missing or
    unknown values default to `wallet-activity`.
  - `wallet-activity=all|airdrops|mints|sales|purchases|transfers|burns`:
    Wallet Activity filter. Missing or unknown values default to `all`.
  - `page=<n>`: current page for the main collected list. Canonical links omit
    `page=1`.
  - `wallet-activity-page=<n>`: Wallet Activity details page. Defaults to `1`.
  - `distribution-page=<n>`: Distributions details page. Defaults to `1`.

## Entry Points

- Open `/{user}/collected` directly.
- Click `TDH` in the profile header stats row.
- Switch to `Collected` from another profile tab.
- Open a shared collected deep link with query parameters.
- Open a deep link such as `/{user}/collected?activity=distributions` to land
  with `Details` already expanded.

## User Journey

1. Open `/{user}/collected`.
   - If the URL already has `activity=...`, `Details` starts open and the lower
     section selects that tab when the value is recognized.
2. Review the top stats block:
   - headline metrics can include `NextGen`, `Meme Sets`, `Memes`,
     `Gradients`, and `Boost`
   - headline metric labels, multiplier values, unique-count copy, and the
     `Details` toggle are message-backed from the source locale
   - collection-backed metrics (`NextGen`, `Meme Sets`, `Memes`, `Gradients`)
     act as shortcuts into that collection; clicking the active metric clears
     that collection filter
   - `Boost` is informational only and does not change filters
   - `Meme Sets` appears only when every valid Meme season has at least one
     full set; it shows the lowest full-set count across those seasons
   - `Seasons` tiles show started Meme seasons, complete-set counts, and
     progress toward the next set
   - `Seasons` heading/count text, show more/less controls, unseized labels,
     and tile set-count text are message-backed from the source locale
   - season tile labels and progress detail copy are message-backed from the
     source locale
   - hover/focus previews a season tile's progress text; click applies or
     clears the Memes season filter
   - unopened Meme seasons can appear as `Unseized` chips
3. Click `Details` to expand the integrated stats panel.
4. In `Details`, review:
   - `Collected` totals and per-season Meme tables
     - collected details headings, table headers, row labels, and per-season
       labels are message-backed from the source locale
     - collected details tables include screen-reader captions and row headers
       for assistive technologies
     - wide tables stay inside their bordered sections on narrow screens; the
       first label column remains visible while the numeric columns scroll
       horizontally by touch or the browser's horizontal scroll controls
   - `Activity Overview`
   - Activity Overview heading, table headings, row labels, and per-season
     labels are message-backed from the source locale
   - Activity Overview tables include screen-reader captions and row headers
     for assistive technologies
   - lower section tabs: `Wallet Activity`, `Distributions`, `TDH History`
     - lower Activity tab labels and the tab-list accessible name are
       message-backed from the source locale
     - lower Activity tabs expose tab/panel relationships and support keyboard
       arrow, Home, and End navigation
   - `Wallet Activity`
     - Wallet Activity heading, filter labels, filter accessible names, empty
       states, and transaction table caption are message-backed from the source
       locale
   - `Distributions`
     - Distributions heading, empty state, table caption, table headings,
       collection names, token link accessible names, and relative time display
       are message-backed or locale-formatted from the source locale
   - `Boost Breakdown`
   - Boost Breakdown static labels and table headings are message-backed from
     the source locale; the table exposes a screen-reader caption, row
     headers, and keyboard-focusable info triggers.
5. Choose `View`:
   - `Native` for profile card holdings.
   - `Network` for xTDH token holdings.
6. Apply filters:
   - Native collection: `All`, `The Memes`, `Gradients`, `NextGen`, `Meme Lab`.
   - Network collection: contract list from current xTDH collections.
   - Memes-only filters: `Seized` and `Season`.
   - Address filter (`All Addresses` or one wallet) is available in native view.
   - View, collection, sort, seized, and filter-scroll control names are
     message-backed from the source locale.
7. Apply sort and browse pages.
   - Collection, filter, sort, and pagination changes add browser-history
     entries, so browser Back and Forward restore earlier collected views.
   - Automatic correction of an unavailable page replaces the current history
     entry instead of adding another one.
8. In native view (outside transfer mode), open token routes from cards:
   - `/the-memes/{id}`, `/6529-gradient/{id}`, `/nextgen/token/{id}`, `/meme-lab/{id}`.
   - Native card results render as a labelled `Collected cards` list with one
     list item per card for assistive technologies.
9. In network view, review xTDH token holdings:
   - Network card results render as a labelled `Collected network cards` list
     with one list item per token for assistive technologies.
   - Network card copy and image alternatives are message-backed from the
     source locale.
10. If transfer is available, click `Transfer`:

- cards switch from links to selection controls
- ERC-1155 cards support quantity selection
- ERC-721 cards are single-select

11. Use the sticky transfer panel to review selection and continue.

## Common Scenarios

- Compare consolidated holdings (`All Addresses`) against one wallet (`address=...`).
- Jump from the summary metrics directly into `NextGen`, `Gradients`, or Meme
  holdings without using the collection dropdown.
- Open `Details` and switch between `Wallet Activity`, `Distributions`, and
  `TDH History`.
- Share or reopen a collected deep link that jumps straight into
  `Distributions` or `TDH History` with `Details` already open.
- Check how many full Meme sets exist and how far the active season is from the
  next set.
- Preview season progress from the stats strip, then click a season tile to
  switch into `The Memes` with that season selected.
- Filter Memes by season and clear back to `All Seasons`.
- Switch to `Network` to inspect per-token `xTDH` and `xTDH/day`.
- Keep a transfer selection while changing pages or filters.

## Edge Cases

- Any non-empty `activity` query opens `Details` immediately on first render.
- If `activity` is unknown, `Details` still opens and the lower section falls
  back to `Wallet Activity`.
- The top stats block still renders on `Network`; if an `address` query is
  already present, it continues to scope both the stats block and Network
  results even though the address dropdown is hidden there.
- `Details` can open even when summary metrics are sparse; if the profile cannot
  produce a stats scope, the panel shows `Stats are unavailable for this profile.`.
- The `Seasons` strip is hidden when there are no started Meme seasons.
- On desktop, the started-season row can collapse behind `+N more`; on
  touch/mobile, seasons stay horizontally scrollable. When a season filter is
  active, the collapsed desktop row keeps that season visible.
- `page` is reserved for the main collected list. Details tables use their own
  page params so they do not reset collected pagination state.
- Clicking another profile tab keeps only `address` and drops collected-specific
  filters including `page`, plus `activity`, `wallet-activity`,
  `wallet-activity-page`, and `distribution-page`.
- Clicking an active collection metric clears that collection filter back to the
  combined Native view.
- Clicking a season tile switches to `The Memes`, applies the selected season,
  and resets incompatible state such as `page`, `subcollection`, and default
  sorts. Clicking the active season tile again clears the season filter.
- Transfer controls are hidden when:
  - screen is mobile,
  - connected wallet is not one of the profile wallets,
  - current native page has no cards.
- If `szn` does not match an available season, the UI stays on `All Seasons`.
- Invalid or zero-card seasons are ignored in the summary metric and season
  strip.
- Cards can show `Not owned by your connected wallet` in transfer mode when the
  current result set includes cards from other profile wallets.
- Selecting the same sort field toggles sort direction.
- Switching collection/view resets page and clears incompatible filters/sort.

## Failure and Recovery

- Initial load shows skeleton placeholders.
- If native collected data fails, the tab falls back to empty-state copy
  (for example `No cards to display`). Empty-state copy is message-backed from
  the source locale and announced as status text for assistive technologies.
- If network token data fails, network cards can fall back to
  `No network tokens found`. This copy follows the same message-backed status
  pattern as the native collected view.
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
- Season-tile shortcuts use the same route filters as the main controls; they do
  not create a separate stats-only state.
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
