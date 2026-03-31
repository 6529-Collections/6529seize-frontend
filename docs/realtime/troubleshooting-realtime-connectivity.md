# Realtime Connectivity Troubleshooting

Parent: [Realtime Index](README.md)

## Overview

Use this page when authenticated websocket updates on Waves or Messages feel
stale, stop arriving, or do not recover after auth changes.

## Location in the Site

- App-wide provider behavior: authenticated websocket session health.
- Most visible on `/waves`, `/waves/{id}`, `/messages`, and routes with
  marketplace preview cards loaded from drop content.
- User-visible impact: drop updates, reactions, ratings, unread counters, and
  marketplace preview refreshes.
- `/nft-activity` and `/network/activity` are request-driven feeds, not this
  websocket channel.

## Entry Points

- New drops, reactions, or ratings stop updating on Waves or Messages.
- Unread counts stop changing while other clients keep receiving new drops.
- Marketplace preview cards stay stale after updates are known to exist.
- One tab recovers after login/logout/account switch while another tab stays
  stale.

## User Journey

1. Confirm wallet auth state in the app header:
   signed in, expected profile, and expected account.
2. Keep a websocket-backed route open (`/waves` or `/messages`) so live events
   are visible.
3. Wait for one health-check cycle (`10s`) after auth or connection changes.
4. If auth changed in another tab, wait for tab convergence (cookie events,
   broadcast fallback, or periodic checks).
5. If this tab still stays stale, re-authenticate in the current tab.
6. Wait one more health-check cycle (`10s`).
7. If updates still do not resume, refresh the tab to remount providers and
   start a fresh websocket session.

## Common Scenarios

- Auth loss or expiry:
  websocket disconnect is expected; updates pause until re-authentication.
- Token change while connected:
  health checks reconnect with the new token.
- Transport drop with valid auth:
  reconnect backoff is automatic (`2s`, `3s`, `4.5s`, capped at `30s`).
- Retry cap reached:
  scheduled reconnect retries stop after `20` attempts, but periodic health
  checks (`10s`) keep trying to reconnect when token and status require it.
- Backgrounded tab:
  browser throttling can delay retries and cross-tab convergence.

## Edge Cases

- Some browsers support cookie-change events and converge faster after auth
  changes.
- If cookie events are unavailable, convergence depends on broadcast messages
  and/or periodic health checks.
- If both cookie events and `BroadcastChannel` support are unavailable, auth
  convergence depends on periodic checks only (`10s` cadence).
- Reconnect timing is deterministic (no jitter), so multiple tabs can retry in
  near lockstep.

## Failure and Recovery

- If transport drops repeatedly, event-driven surfaces can keep cached data but
  stop receiving fresh push events.
- There is no global websocket status banner or reconnect button in the UI.
- Subscribers attach only while websocket status is `connected`.
- Once token checks pass and the socket reconnects, live updates resume without
  a full app restart.
- If issues persist across multiple health cycles, refresh the tab for a clean
  websocket session.
- If only `/nft-activity` or `/network/activity` is stale, use those feed docs
  instead of websocket troubleshooting.

## Limitations / Notes

- This page covers authenticated app websocket behavior only.
- Reconnect behavior is finite by attempt and then periodic health re-check.
- Missed events during disconnect windows are not guaranteed to replay.
- Route-level queries can still refetch while websocket push is stale.
- Not every route consumes websocket data, so reconnect changes may not produce
  visible UI changes immediately.

## Related Pages

- [Authenticated Live Updates](feature-authenticated-live-updates.md)
- [NFT Activity Feed](feature-nft-activity-feed.md)
- [Network Activity Feed](../network/feature-network-activity-feed.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Wave Participation Flow](../waves/flow-wave-participation.md)
- [Wave Chat Typing Indicator](../waves/chat/feature-typing-indicator.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
