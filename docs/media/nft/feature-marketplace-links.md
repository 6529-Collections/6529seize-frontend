# NFT Marketplace Shortcut Links

## Overview

- Supported NFT detail routes can show marketplace logo links in the token
  details panel.
- Selecting a logo opens the same token on an external marketplace in a new
  tab.
- Providers: OpenSea, Magic Eden, Rarible, and Blur (Blur only for the 6529
  Gradient contract).
- No sign-in or wallet connection is required.

## Location in the Site

- `/the-memes/{id}` on `Live` (`focus=live`)
- `/meme-lab/{id}` on `Live` (`focus=live`)
- `/rememes/{contract}/{id}` on `Live` (default tab)
- `/6529-gradient/{id}` detail view

## Entry Points

- Open one of the supported detail routes.
- On The Memes and Meme Lab, switch to `Live`.
- Open the token details column and find the marketplace icon row.

## Destination URLs

- OpenSea opens:
  `https://opensea.io/assets/ethereum/{contract}/{tokenId}`
- Magic Eden opens:
  `https://magiceden.io/item-details/ethereum/{contract}/{tokenId}`
- Rarible opens:
  `https://rarible.com/ethereum/items/{contract}:{tokenId}`
- Blur opens:
  `https://blur.io/eth/asset/{contract}/{tokenId}` only when the token contract
  matches 6529 Gradient.

## Visibility Rules

- Marketplace links render only after token detail data is loaded.
- On tabbed routes, links render only on `Live`.
- On Capacitor iOS sessions, icons are shown only when detected country is
  exactly `US`.
- On Capacitor iOS with empty, unknown, or non-`US` country values, icons stay
  hidden.
- On non-iOS sessions, links are not country-gated.

## Edge Cases

- If the token detail route is unresolved or still loading, marketplace links do
  not render.
- Blur never appears for non-Gradient contracts.
- Icons are logo-only controls; link `title` text carries marketplace names.

## Failure and Recovery

- If an external marketplace is unavailable, the new tab shows provider-side
  errors while the 6529 page remains unchanged.
- Retry by selecting the same icon after provider recovery.
- If one provider fails, other available provider links can still be used.
- If icons are missing on iOS, verify detected country is `US` and retry after
  route reload.

## Limitations / Notes

- These shortcuts are outbound navigation only and do not provide in-app listing
  or trading controls.
- Destination content/availability depends on third-party marketplace services.
- URL formats are provider-specific.
- Provider logos can change without changing link behavior.

## Related Pages

- [Media Index](../README.md)
- [Media NFT Index](README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [NFT Media Source Fallbacks](feature-media-source-fallbacks.md)
- [The Memes Card Tabs and Focus Links](../memes/feature-card-tabs-and-focus-links.md)
- [Meme Lab Card Route Tabs and Navigation](../collections/feature-meme-lab-card-route-tabs-and-navigation.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
- [Docs Home](../../README.md)
