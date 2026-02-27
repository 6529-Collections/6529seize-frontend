# NextGen Collection and Token Media Flow

## Overview

This flow covers the most common NextGen path: featured route to collection
exploration to token-media usage.

## Location in the Site

- Featured NextGen route: `/nextgen`
- Collection routes: `/nextgen/collection/{collection}/*`
- Token routes: `/nextgen/token/{token}/*`

## Entry Points

- Open `/nextgen` from navigation or direct URL.
- Open a shared collection URL directly.
- Open a shared token URL directly.

## User Journey

1. Open `/nextgen` and browse the featured collection.
2. Preview tokens in the collection slideshow.
3. Open collection routes (`Overview`, `About`, `Provenance`, `Trait Sets`).
4. Open `View All` to move into collection art browsing.
5. Open a token route from a slideshow or art card.
6. Use token media modes (`2K`, high-res, `Live`) and media actions.
7. Optionally switch token subviews (`About`, `Provenance`, `Display Center`,
   `Rarity`) for details and downloads.
8. Optionally branch into collection operations routes (`/mint`,
   `/distribution-plan`) when those controls are available.

## Common Scenarios

- Discovery path: `/nextgen` -> collection -> `/art` -> token route.
- Direct token path: shared `/nextgen/token/{token}` URL to media controls.
- Mint operations path: collection route -> `/mint` for wallet-driven minting.

## Edge Cases

- Collection routes only show slideshow when the collection has minted tokens.
- Unknown collection view segments resolve to `Overview`.
- Token `Live` mode can remain static when no animation URL exists.

## Failure and Recovery

- Empty slideshow or art lists usually require route refresh/reload.
- Media-source failures use placeholder fallbacks.
- Mint/admin branches require wallet role and network prerequisites.

## Limitations / Notes

- Slideshow order is randomized and not user-sortable.
- Token media modes and collection-art sort options are fixed lists.

## Related Pages

- [NextGen Home Views and Navigation](feature-nextgen-home-views-and-navigation.md)
- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
