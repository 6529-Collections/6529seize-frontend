# ReMemes Browse, Detail, and Add Flow

## Overview

ReMemes routes support three user jobs: browse the catalog (`/rememes`), inspect
token details (`/rememes/{contract}/{id}`), and submit new ReMemes
(`/rememes/add`).

## Location in the Site

- ReMemes browse route: `/rememes`
- ReMeme detail route: `/rememes/{contract}/{id}`
- ReMeme add route: `/rememes/add`

## Entry Points

- Open `/rememes` directly.
- Open `ReMemes` from sidebar/search.
- On `/rememes`, choose `Add ReMeme`.
- Open a shared ReMeme token URL.

## User Journey

1. Open `/rememes`.
2. Wait for `Fetching ...` to finish, then browse result cards.
3. Apply filters:
   - `Sort` (`Random` or `Recently Added`)
   - `Token Type` (`All`, `ERC-721`, `ERC-1155`)
   - `Meme Reference` (`All` or a selected Meme card)
4. Optional: in `Random` sort mode, use refresh to reroll results.
5. Open a card to `/rememes/{contract}/{id}` and switch tabs:
   - `Live`
   - `Metadata`
   - `References`
6. From `/rememes`, select `Add ReMeme` to open `/rememes/add`.
7. On add route:
   - Enter contract and token IDs (`1,2,3`, ranges like `1-3`, or mixed values).
   - Select one or more Meme references.
   - Run `Validate`.
8. After successful validation, connect wallet (if needed), sign the message,
   and submit `Add Rememe`.
9. On success, review added token links and use `Add Another` to reset.

## Common Scenarios

- Filter ReMemes by one Meme card reference and open a specific replica.
- Review metadata and attributes on detail page before opening marketplace
  shortcuts.
- Add a small token range with one or more Meme references in a single
  submission.

## Edge Cases

- `/rememes` can return no results and shows an empty-state panel.
- Only `meme_id` is persisted in the URL from list filters; sort and token type
  reset on reload.
- `Validate` stays disabled until contract, token IDs, and at least one Meme
  reference are present.
- Large token ranges are rejected during parsing/validation.
- Add submission stays blocked unless user is eligible (contract deployer or
  TDH threshold requirement passes).
- Marketplace shortcut icons on detail pages are hidden on iOS when detected
  country is not `US`.

## Failure and Recovery

- If validation fails, the page shows `Verification Failed` plus error rows.
- If wallet signature fails, the page shows inline signing errors and stays on
  the same form state.
- If submission fails for specific tokens, token-level errors are listed after
  response.
- If detail route fetch returns no token payload, the route can render without a
  dedicated not-found banner; retry with a verified contract/token URL.

## Limitations / Notes

- ReMeme submission is a signed flow; final acceptance is server-validated.
- Add-route requirement text and actual TDH threshold are settings-driven.
- ReMeme detail tabs are in-page tabs, not URL query tabs.
- This page covers ReMemes browse/detail/add behavior; shared NFT marketplace
  behavior is documented separately.

## Related Pages

- [Media Collections Index](README.md)
- [NFT Marketplace Shortcut Links](../nft/feature-marketplace-links.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
