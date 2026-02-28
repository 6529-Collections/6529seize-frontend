# Realtime

## Overview

- Browse NFT transactions on `/nft-activity`.
- Keep authenticated websocket updates healthy on routes that consume live
  events.

## Route Coverage

- Feed route: `/nft-activity`.
- Live-update consumers: `/waves`, `/waves/{id}`, `/messages`, plus marketplace
  preview surfaces that subscribe to websocket events.
- There is no dedicated websocket status route. Connectivity behavior is
  app-level.

## Area Ownership

- This area owns `/nft-activity` browsing behavior and authenticated websocket
  session health.
- Wave-specific live-event rendering stays in the Waves docs area.
- Wallet/session controls stay in the Navigation docs area.

## Features

- [NFT Activity Feed](feature-nft-activity-feed.md)
- [Authenticated Live Updates](feature-authenticated-live-updates.md)

## Flows

- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)

## Troubleshooting

- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Network Index](../network/README.md)
- [Waves Index](../waves/README.md)
- [Navigation Index](../navigation/README.md)
- [Shared Index](../shared/README.md)
- [NextGen Index](../nextgen/README.md)
