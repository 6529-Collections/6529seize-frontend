# Realtime

## Overview

- Realtime docs cover two behaviors:
  NFT transaction browsing on `/nft-activity`, and authenticated websocket
  session health on live-update routes.
- Feed route: `/nft-activity` (`Network -> NFT Activity`).
- Live-update consumers: `/waves`, `/waves/{id}`, `/messages`, plus routes that
  render marketplace preview cards from drop content.
- `/network/activity` is a separate profile-log feed documented in the Network
  docs area.
- There is no dedicated websocket status route; connectivity behavior is
  app-level.

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
