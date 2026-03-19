# Meme Lab Card Route Tabs and Navigation

## Overview

This page owns two connected routes:

- Card detail route: `/meme-lab/{id}`
- Distribution route: `/meme-lab/{id}/distribution`

Card detail uses `focus` tab deep links and previous/next card navigation.
Distribution route shows wallet-level distribution rows, wallet filters, and
pagination.

## Location in the Site

- Meme Lab card route: `/meme-lab/{id}`
- Meme Lab distribution route: `/meme-lab/{id}/distribution`

## Entry Points

- Open a card from `/meme-lab` or `/meme-lab/collection/{collection}`.
- Open a direct card URL such as `/meme-lab/123`.
- Open a direct tab URL such as `/meme-lab/123?focus=activity`.
- On card `Live`, use `Distribution Plan` when shown.
- Open `/meme-lab/{id}/distribution` directly.

## User Journey

### Card Route `/meme-lab/{id}`

1. Open `/meme-lab/{id}`.
2. The route reads `focus` and resolves one tab:
   `Live`, `Your Cards`, `The Art`, `Collectors`, `Activity`, or `Timeline`.
3. If `focus` is missing or unsupported, the page opens `Live` and rewrites the
   query to `?focus=live`.
4. Switch tabs from the tab row; each switch rewrites `focus` in place.
5. Use previous/next arrows to move to adjacent card IDs while keeping the
   current query string.
6. On `Live`, review card stats, collection links, references, and marketplace
   shortcuts (when available).
7. On `Your Cards`, connect wallet to review ownership summary, transfer
   actions, and wallet transaction history.
8. On `The Art`, review original media, fullscreen controls, Arweave
   links/downloads, and card details for the currently visible slide.
9. On `Collectors`, review the holder leaderboard.
10. On `Activity`, filter transaction types, review rows, and paginate.
11. On `Timeline`, review card history milestones.

### Distribution Route `/meme-lab/{id}/distribution`

1. Open this route from `Distribution Plan` on `Live`, or open the route
   directly.
2. The route validates `{id}` as a positive integer.
3. Review the page header, optional distribution photos, and wallet table.
4. Use wallet search filters to narrow rows; changing filters resets pagination
   to page 1.
5. Review allowlist-phase columns, minted/total columns, and pagination when
   enough rows are available.

## Common Scenarios

- Share a deep link such as `/meme-lab/123?focus=timeline`.
- Stay on the same tab while moving card-to-card with navigation arrows.
- Open `Distribution Plan`, filter for one or more wallets, then clear filters
  and return to the card route.

## Edge Cases

- Unsupported `focus` values fall back to `Live`.
- If card metadata does not resolve for `{id}`, the route can render only the
  page heading, with no inline not-found panel.
- Previous/next arrows are disabled at the first and last available card index.
- `The Art` can still open in animated mode when top-level `animation` is
  blank but metadata provides `animation` or `animation_url`.
- If only one original media URL resolves, `The Art` shows just that media
  slide and its matching download/link row.
- `File Type` and `Dimensions` rows appear only when the active `The Art`
  slide has usable metadata values.
- `Activity` can show a loading spinner first, then an empty-state panel when
  no rows are available.
- `/meme-lab/{id}/distribution` with non-positive or invalid IDs shows the
  distribution not-found screen.
- Distribution routes with valid IDs can show an empty
  `The Distribution Plan will be made available soon!` state.
- Distribution wallet filters can show `No results found for the search
  criteria.` even when unfiltered distribution data exists.
- Distribution fetch failures fall back to the same empty-state view (no
  dedicated inline error panel).

## Failure and Recovery

- If card content does not appear, reopen the card from `/meme-lab` or refresh
  `/meme-lab/{id}`.
- If a deep link opens the wrong tab, replace `focus` with a supported key or
  remove it.
- If card detail stays on heading-only state, open a nearby card ID or reopen
  from `/meme-lab`.
- If distribution filters return no rows, clear wallet filters and retry.
- If distribution remains empty without filters, retry later from the same
  route.

## Limitations / Notes

- `focus` supports only the six tab keys listed above.
- Tab switches use in-place URL replacement, so browser Back does not step
  through prior tab changes.
- Tab switches preserve `focus`; other query keys are not preserved.
- `Distribution Plan` link on card `Live` is shown only when distribution is
  available for that card.
- Marketplace shortcuts are hidden on iOS unless detected country is `US`.
- Card and distribution data are API-backed snapshots and can lag briefly.
- Card-level ownership chips, marketplace details, media fallback, and transfer
  behavior are owned by media NFT feature pages.

## Related Pages

- [Media Collections Index](README.md)
- [Meme Lab List and Collection Browsing](feature-meme-lab-list-and-collection-browsing.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Marketplace Shortcut Links](../nft/feature-marketplace-links.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
