# Notifications

Notifications docs cover two user-facing surfaces:
the `/notifications` feed and app-only push notification controls.

## Overview

- `/notifications` is an authenticated My Stream feed.
- Feed rows cover follows, mentions/quotes/replies, identity score updates,
  reactions/votes/boosts, all-drops activity rows, wave invites, priority
  alerts, and unknown-cause fallback rows.
- Users can filter by cause (`All`, `Mentions`, `Replies`, `Identity`,
  `Reactions`, `Invites`), open drop context, and load older pages from the top
  edge.
- Feed recovery states include profile loading, wallet/handle reconnect prompts,
  proxy-profile blocking, and retry states (`Try again`).
- Opening `/notifications` marks the feed read; opening grouped `New reactions`
  rows marks those grouped notification IDs read.
- In Capacitor app builds, `Push Notifications` opens device-level toggles and
  push tap routing that ignores payloads whose `profile_id` conflicts with the
  connected profile.
- Use this area when notifications fail to load, rows appear stale, or mobile
  push settings/tap routing fail.

## Features

- [Notifications Feed](feature-notifications-feed.md)
- [Mobile Push Notifications](feature-mobile-push-notifications.md)

## Flows

- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)

## Troubleshooting

- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Navigation Index](../navigation/README.md)
- [Shared Index](../shared/README.md)
- [Waves Index](../waves/README.md)
- [Realtime Index](../realtime/README.md)
