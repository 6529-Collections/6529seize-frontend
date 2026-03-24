# Media Rendering

## Overview

- Use this subarea for rendering behavior reused across media routes.
- Canonical coverage:
  - `/6529-gradient` list sorting, URL normalization, and loading states.
  - Interactive HTML (`text/html`) rendering on shared drop/card surfaces and
    The Memes submission preview.
- Out of scope:
  - Route-specific minting and tab behaviors (Memes and Collections subareas).
  - Ownership badges, marketplace actions, transfer, and media fallback order
    (Media NFT subarea).

## Features

- [Interactive HTML Media Rendering](feature-interactive-html-rendering.md):
  sandboxed iframe behavior, trusted-host checks, touch `Tap to load` gating,
  submission-preview validation, and non-sandboxed latest-drop exceptions.
- [6529 Gradient List Sorting and Loading](feature-6529-gradient-list-sorting-and-loading.md):
  `/6529-gradient` sorting, query-key normalization (`sort`, `sort_dir`), and
  full-list loading behavior.

## Flows

- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)

## Troubleshooting

- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)

## Stubs

- None.

## Related Areas

- [Media Index](../README.md)
- [Media NFT Index](../nft/README.md)
- [Media Collections Index](../collections/README.md)
- [Waves Index](../../waves/README.md)
- [Home Index](../../home/README.md)
- [NextGen Token View](../../nextgen/feature-token-media-rendering.md)
