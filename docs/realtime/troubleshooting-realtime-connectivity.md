# Realtime Connectivity Troubleshooting

Parent: [Realtime Index](README.md)

## Overview

Use this page when authenticated websocket updates feel stale, stop arriving, or
do not recover after auth changes.

## Location in the Site

- Global provider layer: app-wide authenticated websocket session health.
- User-visible impact: wave drop updates/reactions/ratings, unread counters,
  and marketplace preview refreshes.
- `/nft-activity` is not websocket-driven; use its feature/flow pages for
  route fetch issues.

## Entry Points

- Wave activity looks stale after login/logout or account switching.
- Different tabs show different live-update state.
- Live-update surfaces recover only after manual refresh.

## User Journey

1. Confirm auth state from wallet controls:
   signed in, expected profile, and valid wallet token.
2. Keep a websocket-backed route open (Waves or Messages) so live events are
   visible.
3. Wait for the health cycle:
   immediate checks on status changes, plus periodic checks every `10s`.
4. If still stale, re-authenticate so token change handling can reconnect the
   session.
5. If updates still do not resume, refresh the tab to force provider
   re-initialization.

## Common Scenarios

- Auth loss or expiry:
  expected disconnect; live updates pause until re-authentication.
- Token change in another tab:
  tabs converge through cookie events or broadcast-channel fallback.
- Reconnect retries hit the cap:
  retry backoff runs up to `20` attempts, then periodic health checks keep
  probing.
- Backgrounded tab delay:
  browser scheduling can slow retries and cross-tab convergence.

## Edge Cases

- Some browsers provide cookie state event support and therefore converge faster.
- Other environments depend on fallback broadcast/health-check behavior and can be
  slower.
- Reconnect timing is deterministic (`2s`, `3s`, `4.5s`, capped at `30s`), so
  multiple tabs can retry in near lockstep.

## Failure and Recovery

- If transport drops repeatedly, event-driven surfaces can keep cached data but
  stop receiving fresh push events.
- There is no global route-level websocket error banner when this happens.
- Once token checks pass and the socket reconnects, live updates resume without
  a full app restart.
- If issues persist across multiple health cycles, refresh the tab for a clean
  websocket session.

## Limitations / Notes

- There is no dedicated global websocket status banner in the UI.
- Reconnect behavior is finite by attempt and then periodic health re-check.
- Not every route consumes websocket data, so reconnect changes may not always
  produce visible UI changes.

## Related Pages

- [Authenticated Live Updates](feature-authenticated-live-updates.md)
- [NFT Activity Feed](feature-nft-activity-feed.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Wave Participation Flow](../waves/flow-wave-participation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
