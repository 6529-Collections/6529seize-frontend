# Media NFT

## Overview

- Use this subarea for shared NFT behavior used across media pages.
- This subarea owns ownership indicators, marketplace shortcuts, media-source
  fallback order, and transfer actions.
- Route families covered here:
  - `/`, `/the-memes`, `/the-memes/{id}`, `/the-memes/mint`
  - `/meme-lab`, `/meme-lab/{id}`, `/meme-lab/collection/{collection}`
  - `/rememes/{contract}/{id}`
  - `/6529-gradient`, `/6529-gradient/{id}`
  - `/{user}/collected`, `/nextgen/token/{token}[/{view}]` (transfer entry
    points)
- Keep route-specific tab/filter behavior in the Memes, Collections, and
  Rendering subareas.

## Features

- [NFT Balance Indicators](feature-balance-indicators.md):
  signed-in `SEIZED xN` / `UNSEIZED` states and ownership badge variants across
  supported list/detail surfaces.
- [NFT Marketplace Shortcut Links](feature-marketplace-links.md):
  outbound OpenSea, Magic Eden, Rarible, and Blur links on supported detail
  routes, including iOS country gating.
- [NFT Media Source Fallbacks](feature-media-source-fallbacks.md):
  image/video source order on list/detail routes, home latest-drop artwork, and
  The Memes mint artwork.
- [NFT Transfer](feature-transfer.md):
  collected-tab batch transfer and single-token transfer on Memes, Meme Lab,
  Gradient, and NextGen token pages.

## Flows

- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)

## Troubleshooting

- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)

## Stubs

- None.

## Related Areas

- [Media Index](../README.md)
- [Media Memes Index](../memes/README.md)
- [Media Collections Index](../collections/README.md)
- [Media Rendering Index](../rendering/README.md)
- [Profiles Index](../../profiles/README.md)
- [NextGen Index](../../nextgen/README.md)
