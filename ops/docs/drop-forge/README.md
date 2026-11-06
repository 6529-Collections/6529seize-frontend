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
- listing and managing creator-contract admins

## Route Coverage

- `/drop-forge`
- `/drop-forge/craft`
- `/drop-forge/craft/{id}`
- `/drop-forge/launch`
- `/drop-forge/launch/{id}`

## Navigation and Visibility

- `Drop Forge` appears in page search only when the connected wallet can access
  the landing route.
- The web and app sidebars insert `Drop Forge` after `About` when the connected
  wallet can access the landing route.
- Search can additionally expose `Craft Claims` and `Launch Claims` when the
  current wallet can open those sections.
- Landing access requires a connected wallet with at least one of:
  distribution-admin access, claims-admin access, or Drop Forge admin access.
- `Craft Claims` access is narrower: distribution-admin wallets only.
- `Launch Claims` access is narrower: claims-admin or Drop Forge admin wallets.
- Drop Forge admin means the active creator contract's owner or an approved
  on-chain admin. These wallets also have launch action-tracking access.
- Every wallet that can see the landing route can see `Contract Admins`, with
  the owner first. Add/Revoke controls are restricted to the owner and
  configured claims-admin wallets; the contract itself only accepts these
  changes from its owner.
- While permissions are still resolving, Drop Forge routes show
  `Checking permissions...`.
- If the wallet lacks access after permissions resolve, the page shows
  `You have no power here`, then redirects to `/` after 10 seconds.
- When the connected wallet is on Sepolia, Drop Forge pages show a `Testnet`
  indicator and use the testnet minting contract for launch data.

## Features

- [Launch Automation and Wallet Funding](feature-launch-automation-settings.md)

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

## Internal backend setup

Preparation runs in `memesDistributionHandler`; on-chain execution runs in
`dropForgeLaunchHandler`. Both consume queued requests, with one-time future phase
and Research schedules and continuations only while work is outstanding. There
are no permanent one-minute triggers. Execution roles use backend stage config,
without feature-specific GitHub environment variables. Deployment order and IAM,
queue recovery and rollout instructions live in the backend's maintained
[setup guide](https://github.com/6529-Collections/6529seize-backend/blob/agent-prxt/drop-forge-auto-launch-requirements/docs/drop-forge-auto-launch-setup.md).

These are internal operator procedures. Keep the public help corpus focused on
Memes, minting phases/windows and user-facing mention behavior, rather than
launch signing, distribution processing or infrastructure setup.

Post-mint work adds a one-time 17:15 preview and fresh 18:00 execution checks.
Research and Pay Artist require finalized RPC/database agreement and completed
indexing; Launch shows the evidence and retry eligibility. All feature reports go
only to the dedicated operations wave, with no changes to existing mint announcements.
