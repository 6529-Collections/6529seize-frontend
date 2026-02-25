# NFT Marketplace Shortcut Links

## Overview

Supported NFT detail pages expose marketplace shortcut icons that open the same
token on major external marketplaces. This gives users a direct path from a
token detail view to trading/listing pages without manually copying contract and
token IDs.

## Location in the Site

- The Memes card route: `/the-memes/{id}` (`Live` tab)
- Meme Lab card route: `/meme-lab/{id}` (`Live` tab)
- ReMemes token route: `/rememes/{contract}/{id}` (`Live` tab)
- 6529 Gradient token route: `/6529-gradient/{id}`

## Entry Points

- Open a supported NFT detail route above.
- On tabbed routes, keep or switch to `Live`.
- Scroll the right-side detail column to the marketplace icon row.

## User Journey

1. User opens a supported NFT detail page.
2. The page renders marketplace icon buttons in the token details area when the
   platform/region gate allows them.
3. User selects a marketplace icon.
4. The destination opens in a new browser tab on the corresponding external
   marketplace item page.

## Common Scenarios

- OpenSea opens:
  `https://opensea.io/assets/ethereum/{contract}/{tokenId}`
- Magic Eden opens:
  `https://magiceden.io/item-details/ethereum/{contract}/{tokenId}`
- Rarible opens:
  `https://rarible.com/ethereum/items/{contract}:{tokenId}`
- Blur opens:
  `https://blur.io/eth/asset/{contract}/{tokenId}` when the NFT contract is the
  6529 Gradient contract.

## Edge Cases

- Marketplace icons are hidden on iOS when the detected country is not `US`.
- On iOS with `US` country detection, marketplace icons remain available.
- Blur is contract-specific and does not appear for non-Gradient collections.
- Icons are visual buttons (logo-only); hover/focus title text provides
  marketplace names.

## Failure and Recovery

- If an external marketplace page is unavailable, users see the destination
  site error in the new tab while the original 6529 page remains unchanged.
- Retrying uses the same icon again after the external site recovers.
- Users can still open other marketplace destinations if one provider is down.

## Limitations / Notes

- These shortcuts are outbound navigation only and do not provide in-app listing
  or trading controls.
- Destination content/availability depends on third-party marketplace services.
- URL formats are marketplace-specific and can differ by provider.
- Marketplace icons use provider-supplied branding assets, so logo artwork can
  change while destination URLs and click behavior remain the same.

## Related Pages

- [Media Index](../README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [NFT Media Source Fallbacks](feature-media-source-fallbacks.md)
- [The Memes Card Tabs and Focus Links](../memes/feature-card-tabs-and-focus-links.md)
- [Docs Home](../../README.md)
