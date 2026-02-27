# Meme Lab Card Route Tabs and Navigation

## Overview

`/meme-lab/{id}` is the card route for one Meme Lab token.
It supports tab deep links with `focus`, card-to-card navigation, and a
distribution handoff to `/meme-lab/{id}/distribution`.

## Location in the Site

- Meme Lab card route: `/meme-lab/{id}`
- Meme Lab distribution route: `/meme-lab/{id}/distribution`

## Entry Points

- Open a card from `/meme-lab` or `/meme-lab/collection/{collection}`.
- Open a direct card URL such as `/meme-lab/123`.
- Open a direct tab deep link such as `/meme-lab/123?focus=activity`.
- On `Live`, use `Distribution Plan` when shown.

## User Journey

1. Open `/meme-lab/{id}`.
2. If `focus` matches a supported tab key, that tab opens; otherwise the route
   opens on `Live`.
3. Use tabs to switch between `Live`, `Your Cards`, `The Art`, `Collectors`,
   `Activity`, and `Timeline`.
4. Each tab switch updates `focus` in the URL.
5. Use previous/next card arrows to move to adjacent card IDs while keeping the
   current query state.
6. On `Live`, review card stats, collection links, references, and marketplace
   shortcuts (when available).
7. On `Your Cards`, connect wallet to view ownership summaries, transfer
   actions, and wallet-specific transaction history.
8. On `The Art`, inspect original media views, fullscreen controls, Arweave
   links, and download actions.
9. Open `/meme-lab/{id}/distribution` to inspect distribution rows, wallet
   filtering, and pagination.

## Common Scenarios

- Share a direct tab URL such as `/meme-lab/123?focus=timeline`.
- Open `Your Cards` to confirm owned editions and transfer availability.
- Open `Distribution Plan`, filter by wallet, then return to the card route.

## Edge Cases

- Unknown `focus` values fall back to `Live`.
- If card metadata does not resolve for `{id}`, the route can show only the
  page heading with no inline not-found panel.
- Previous/next arrows are disabled at route bounds.
- `/meme-lab/{id}/distribution` with non-positive or invalid IDs shows the
  distribution not-found screen.
- Distribution routes can show an empty "made available soon" state when no
  distribution rows exist yet.
- Distribution wallet search can return a no-results row even when the card has
  distribution data.

## Failure and Recovery

- If card content does not load, refresh `/meme-lab/{id}` or reopen the card
  from `/meme-lab`.
- If a deep link opens the wrong tab, replace `focus` with a supported key or
  remove it.
- If distribution search returns no rows, clear wallet filters and retry.
- If distribution data is not available yet, retry later from the same route.

## Limitations / Notes

- `focus` supports only the six card tab keys.
- Tab switches use in-place URL replacement, so browser Back does not step
  through each tab change.
- Card and distribution data are live API-backed snapshots and can lag briefly.
- Card-level ownership chips, marketplace gating, media fallback, and transfer
  details are owned by NFT feature pages.

## Related Pages

- [Media Collections Index](README.md)
- [Meme Lab List and Collection Browsing](feature-meme-lab-list-and-collection-browsing.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Marketplace Shortcut Links](../nft/feature-marketplace-links.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
