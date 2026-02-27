# Media Memes

## Overview

- Use this subarea for The Memes browse, card, distribution, mint, and
  schedule routes.
- Core routes: `/the-memes`, `/the-memes/{id}`,
  `/the-memes/{id}/distribution`, `/the-memes/mint`, and `/meme-calendar`.
- Home route `/` owns the latest-drop countdown and stats surfaces that link
  into The Memes mint and distribution routes.
- When card or distribution data is not published yet, numeric
  `/the-memes/{id}` and `/the-memes/{id}/distribution` routes show the shared
  next-mint fallback panel.

## Features

- [The Memes List Browsing and Sorting](feature-the-memes-list-browsing-and-sorting.md):
  `/the-memes` sort, filter, and list-loading behavior.
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md):
  `/the-memes/{id}` tab deep links, URL `focus` state, and card fallback.
- [The Memes Mint Flow](feature-mint-flow.md):
  `/the-memes/mint` recipient selection, phase-aware actions, and transaction
  states.
- [Now Minting Countdown](feature-now-minting-countdown.md):
  countdown/status card behavior on `/`, `/the-memes/{id}`,
  `/the-memes/{id}/distribution`, and `/the-memes/mint`.
- [Latest Drop Stats Grid](feature-latest-drop-stats-grid.md):
  latest-drop `Edition`, `Status`, `Mint price`, and `Floor` rows on `/`.
- [Memes Minting Calendar](feature-minting-calendar.md):
  `/meme-calendar` controls plus the shared next-mint fallback panel on card
  and distribution routes.

## Flows

- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)

## Troubleshooting

- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)

## Stubs

- None.

## Related Areas

- [Media Index](../README.md)
- [Media Collections Index](../collections/README.md)
- [Waves Memes Index](../../waves/memes/README.md)
- [Navigation Index](../../navigation/README.md)
- [Media NFT Index](../nft/README.md)
