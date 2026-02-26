# Collected Tab and Transfer Controls

## Overview

The `Collected` profile tab shows owned NFTs by collection with list-level filtering,
sorting, and pagination. It now also exposes owner-only transfer mode on desktop
for bulk NFT movement to another wallet.

Transfer mode is a separate interaction state inside the same tab. It is not a
separate route and does not alter the tab's sort/filter/pagination behavior.

## Location in the Site

- Route: `/{user}/collected`
- Optional query parameters:
  - `search=<keyword>` for collection search
  - `sort_by=<field>` and `sort_direction=<asc|desc>` for list ordering
  - `seized=<all|yes|no>` where available for the selected collection type
  - `szn=<season-id>` for seasonal card views where supported
  - `address=<wallet>` to scope tab-level identity row context
  - `page=<n>` for pagination

## Entry Points

- Open any profile with `/{user}/collected`.
- Use profile tab links from the shared profile header.
- Open a profile collected deep link with preserved query parameters.

## User Journey

1. Open the collected tab.
2. Apply filters and sorting:
  - collection, sort, seized filter, and season filter by collection rules.
  - The season filter shows `All Seasons` plus season IDs fetched from the latest
    seasonal catalog, so new season entries can appear without deployment.
3. Browse paginated card grid and open card links in normal viewing mode.
4. Enter transfer mode:
  - Desktop-only `Transfer` button appears when ownership transfer is applicable.
  - The toggle hides the regular card link behavior and enables selection.
5. Select transfer candidates:
  - ERC-1155 cards can be selected with quantity controls.
  - ERC-721 cards are selected as single units.
  - Cards with no transferable connected-wallet balance show a not-owned state.
6. Open the sticky transfer panel at page bottom:
  - Review selected items.
  - Remove selections or continue to recipient step.
7. Use recipient modal, then sign wallet transactions as in the shared NFT
   transfer flow.

## Common Scenarios

- Filter by collection and sort before entering transfer mode; selected items stay in
  the same filtered/paginated context.
- Transfer across mixed collections as long as the destination wallet and connected
  wallet context are valid.
- Reduce selected quantities for ERC-1155 items to send only part of a balance.
- Exit transfer mode to return card links to normal navigation.

## Edge Cases

- Transfer mode is hidden when:
  - the user is not on desktop,
  - no cards are shown on the current view,
  - the connected wallet does not match a profile wallet for the viewed profile.
- For profiles that have connected-wallet ownership but mixed balances, some cards
  can be selectable while others are informational-only.
- If a `szn` value in the URL does not match a known season id, the filter
  defaults to `All Seasons`.
- The transfer panel requires at least one selected item before `Continue` is
  enabled.
- Data for wallet-scoped transfer quantities loads separately from base collected
  rows and can lag one render cycle when entering transfer mode.

## Failure and Recovery

- If transfer quantity data fails to load, cards can still be browsed but transfer
  controls may remain in loading state until request completion.
- If the connected wallet disconnects while transfer mode is active, transfer mode
  is cleared and must be re-enabled.
- If transfer submission fails in modal, users can re-open transfer mode and rebuild
  the selection.
- If profile tabs fail to resolve in normal route mode, profile-level not-found
  behavior applies:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)

## Limitations / Notes

- Transfer mode is an enhancement of the existing tab and does not add new profile
  rows or alter card ownership calculations outside the transfer flow.
- Only cards visible in the current page/filter context are selectable.
- Multi-card recipient selection and all transaction execution details are shared
  with the global transfer flow documented in
  [NFT Transfer](../../media/nft/feature-transfer.md).

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [NFT Transfer](../../media/nft/feature-transfer.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
