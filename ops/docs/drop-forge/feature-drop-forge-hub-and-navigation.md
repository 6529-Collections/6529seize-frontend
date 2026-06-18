# Drop Forge Hub and Section Navigation

## Overview

`/drop-forge` is the landing route for internal claim operations. It presents
two section cards:

- `Craft Claims`: prepare winning submissions for distribution
- `Launch Claims`: initialize claim phases, update claim config, and run
  airdrops

## Location in the Site

- Route: `/drop-forge`
- App sidebar row: `Drop Forge` (only when the connected wallet can access it)
- Header search page results: `Drop Forge`, and optionally `Craft Claims` and
  `Launch Claims`

## Entry Points

- Open `/drop-forge` directly.
- Select `Drop Forge` from the app sidebar.
- Open the route from header search page results.

## User Journey

1. Open `/drop-forge`.
2. The page checks the connected wallet's Drop Forge permissions.
3. If access is allowed, the page shows the `Drop Forge` title plus a
   `Testnet` indicator when the connected wallet is on Sepolia.
4. Review the two section cards:
   - `Craft Claims`
   - `Launch Claims`
5. Select one card to move into that queue.
6. If the current wallet can see the landing route but cannot open one of the
   sections, that card stays visible but disabled.

## Common Scenarios

- Distribution admin:
  - Can open the landing route.
  - Can open `Craft Claims`.
  - Cannot open `Launch Claims` unless that wallet also has launch access.
- Claims admin or Drop Forge admin:
  - Can open the landing route.
  - Can open `Launch Claims`.
  - Cannot open `Craft Claims` unless that wallet also has distribution-admin
    access.
- Search-driven entry:
  - Page search can take the user straight to `/drop-forge`,
    `/drop-forge/craft`, or `/drop-forge/launch` when those routes are allowed.

## Edge Cases

- If the wallet is disconnected, the page never reaches the landing cards and
  stays in permission fallback.
- If permissions are still loading, the route shows `Checking permissions...`
  instead of stale access decisions.
- Disabled section cards remain visible on the landing page when the wallet has
  partial Drop Forge access but not that specific section's permission.
- The landing page does not expose claim rows itself; it only links to the
  craft and launch queues.

## Failure and Recovery

- If access is denied after permission checks complete, the page shows
  `You have no power here` and redirects to `/` after 10 seconds.
- Reconnect with a different wallet or switch to a wallet with the required
  role, then reopen `/drop-forge`.
- If search or sidebar entry points are missing, open the route directly to
  confirm whether the current wallet has access.

## Limitations / Notes

- Drop Forge is wallet-gated; there is no public browse mode.
- Landing-route access is broader than section access. Seeing the hub does not
  guarantee access to both `Craft Claims` and `Launch Claims`.
- The `Testnet` indicator follows the currently connected chain, not a separate
  route toggle.

## Related Pages

- [Drop Forge Index](README.md)
- [Craft Claims List and Detail](feature-craft-claims-list-and-detail.md)
- [Launch Claims List and Detail](feature-launch-claims-list-and-detail.md)
- [Header Search Modal](../navigation/feature-header-search-modal.md)
- [Docs Home](../README.md)
