# Collected Tab and Transfer Mode

## Overview

The `Collected` tab at `/{user}/collected` shows profile holdings with filters,
sorting, and pagination.

It has two views:
- `Native`: profile card holdings for The Memes, Gradients, NextGen, and Meme Lab.
- `Network`: xTDH token holdings by contract.

Transfer mode is part of this tab (not a separate route) and applies to native
cards.

## Location in the Site

- Route: `/{user}/collected`
- Query parameters:
  - `address=<wallet>`: scope results to one wallet address.
  - `collection=<memes|gradients|nextgen|memelab|network>`
  - `subcollection=<contract-address>`: network collection filter.
  - `seized=<seized|not_seized>`: Memes-only filter.
  - `szn=<season-id>`: Memes-only season filter.
  - `sort-by=<token_id|tdh|rank|xtdh|xtdh_day>`
  - `sort-direction=<asc|desc>`
  - `page=<n>`

## Entry Points

- Open `/{user}/collected` directly.
- Click `TDH` in the profile header stats row.
- Switch to `Collected` from another profile tab.
- Open a shared collected deep link with query parameters.

## User Journey

1. Open `/{user}/collected`.
2. Choose `View`:
   - `Native` for profile card holdings.
   - `Network` for xTDH token holdings.
3. Apply filters:
   - Native collection: `All`, `The Memes`, `Gradients`, `NextGen`, `Meme Lab`.
   - Network collection: contract list from current xTDH collections.
   - Memes-only filters: `Seized` and `Season`.
   - Address filter (`All Addresses` or one wallet) is available in native view.
4. Apply sort and browse pages.
5. In native view (outside transfer mode), open token routes from cards:
   - `/the-memes/{id}`, `/6529-gradient/{id}`, `/nextgen/token/{id}`, `/meme-lab/{id}`.
6. If transfer is available, click `Transfer`:
   - cards switch from links to selection controls
   - ERC-1155 cards support quantity selection
   - ERC-721 cards are single-select
7. Use the sticky transfer panel to review selection and continue.

## Common Scenarios

- Compare consolidated holdings (`All Addresses`) against one wallet (`address=...`).
- Filter Memes by season and clear back to `All Seasons`.
- Keep a transfer selection while changing pages or filters.
- Switch to `Network` to inspect per-token `xTDH` and `xTDH/day`.

## Edge Cases

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
- If transfer-balance data fails, cards can appear not selectable in transfer mode;
  exit transfer mode and retry.
- If wallet connection is lost during transfer mode, transfer mode closes and
  selection is cleared.
- If route/profile resolution fails before render, shared not-found behavior applies:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)

## Limitations / Notes

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
