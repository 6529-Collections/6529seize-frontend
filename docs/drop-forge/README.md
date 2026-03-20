# Drop Forge

## Overview

Use this area for internal claim-preparation and launch operations for The
Memes minting pipeline.

This area covers:

- the permission-gated landing route
- craft claim queue and claim-detail editing
- launch claim queue and launch-detail operations
- publishing claim assets to Arweave
- initializing or updating on-chain launch phases and running airdrops

## Route Coverage

- `/drop-forge`
- `/drop-forge/craft`
- `/drop-forge/craft/{id}`
- `/drop-forge/launch`
- `/drop-forge/launch/{id}`

## Navigation and Visibility

- `Drop Forge` appears in page search only when the connected wallet can access
  the landing route.
- The app sidebar inserts `Drop Forge` after `About` when the connected wallet
  can access the landing route.
- Search can additionally expose `Craft Claims` and `Launch Claims` when the
  current wallet can open those sections.
- Landing access requires a connected wallet with at least one of:
  distribution-admin access, claims-admin access, or Drop Forge admin access.
- `Craft Claims` access is narrower: distribution-admin wallets only.
- `Launch Claims` access is narrower: claims-admin or Drop Forge admin wallets.
- While permissions are still resolving, Drop Forge routes show
  `Checking permissions...`.
- If the wallet lacks access after permissions resolve, the page shows
  `You have no power here`, then redirects to `/` after 10 seconds.
- When the connected wallet is on Sepolia, Drop Forge pages show a `Testnet`
  indicator and use the testnet minting contract for launch data.

## Features

- [Drop Forge Hub and Section Navigation](feature-drop-forge-hub-and-navigation.md)
- [Craft Claims List and Detail](feature-craft-claims-list-and-detail.md)
- [Launch Claims List and Detail](feature-launch-claims-list-and-detail.md)

## Flows

- [Drop Forge Craft-to-Launch Flow](flow-drop-forge-craft-to-launch.md)

## Troubleshooting

- [Drop Forge Access and Claim Operations](troubleshooting-drop-forge-access-and-claims.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Navigation Index](../navigation/README.md)
- [Header Search Modal](../navigation/feature-header-search-modal.md)
- [The Memes Mint Flow](../media/memes/feature-mint-flow.md)
- [Now Minting Countdown](../media/memes/feature-now-minting-countdown.md)
- [EMMA Distribution Review](../emma/feature-subscriptions-distribution-review.md)
