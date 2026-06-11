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
- Opening a wave/DM thread marks that wave/thread read and invalidates
  notifications queries so unread indicators refresh for the active account.
- In Capacitor app builds, `Push Notifications` opens device-level toggles and
  push tap routing that validates target profile metadata, matches the target
  against connected accounts, and switches to the matched account/profile
  before navigating when possible.
- Stable push `device_id` recovery now handles missing/invalid secure-storage
  values by regenerating and persisting a new ID, so registration can continue
  without a manual reset in common storage-failure cases.
- Push registration retries transient failures automatically (for example
  network interruption, `429`, `408`, and `5xx` responses), and applies server
  retry hints when available.
- Duplicate push registration attempts with the same `device_id`, token, and
  profile in one active app session are skipped.
- When the active connected profile changes, the `/notifications` feed reloads
  for the new identity without reusing previous-profile rows as placeholder
  content.
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
