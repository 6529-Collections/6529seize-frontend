# Realtime Connectivity Troubleshooting

Parent: [Realtime Index](README.md)

## Overview

Use this page when websocket-driven updates feel stale, stop arriving, or fail to
reconnect after auth changes.

## Location in the Site

- Route: `/nft-activity` and any websocket-backed wave flow surfaces (for
  wave updates and typing indicators).
- Global websocket behavior is configured in app providers.

## Entry Points

- Realtime updates stop arriving after switching accounts.
- Realtime-driven features continue showing old data after long idle periods.
- A manual refresh appears to be the only way to resume updates.

## User Journey

1. Confirm auth state from wallet controls:
   signed in, expected profile, and valid wallet token.
2. Confirm auth token lifecycle events:
   sign-out, token refresh, or re-auth.
3. If stale, switch to a tab with `/nft-activity` or an active wave and wait for
   the websocket health cycle.
4. If updates still do not resume, refresh the page to force a fresh provider
   initialization pass.
5. Reopen the relevant route and verify events return.

## Common Scenarios

- Auth loss:
  - Expected: updates pause until re-auth.
  - Fix: reconnect wallet/profile, then revisit a websocket-consuming route.
- Long-lived silent interval:
  - Expected: recovery is periodic and can take up to the next health probe cycle.
  - Fix: check auth and refresh if needed.
- Reconnect retries hit the cap:
  - Expected: retries stop, then a periodic cycle can start a fresh attempt.
  - Fix: keep route open and allow a few health checks, or refresh.
- Multi-tab mismatch:
  - Expected: convergence can vary with browser event support.
  - Fix: re-open route in each tab; one tab can trigger fresh auth refresh path.

## Edge Cases

- Some browsers provide cookie state event support and therefore converge faster.
- Other environments depend on fallback broadcast/health-check behavior and can be
  slower.
- Backgrounded tabs can delay reconnection work until the browser schedules it.

## Failure and Recovery

- If websocket transport repeatedly drops, event-driven features keep
  functioning on cached/recent content but no longer receive fresh push events
  until reconnect.
- When auth/token checks eventually pass and connection is restored, features
  begin receiving events again without a route-level error banner.
- If the problem persists after several health cycles, a hard reload is the most
  reliable way to force a fresh session start.

## Limitations / Notes

- There is no dedicated global websocket status banner in the UI.
- Reconnect behavior is finite by attempt and then periodic health re-check.

## Related Pages

- [Authenticated Live Updates](feature-authenticated-live-updates.md)
- [NFT Activity Feed](feature-nft-activity-feed.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [MyStream Provider](../waves/README.md)
- [Wave Typing Indicator](../waves/chat/feature-typing-indicator.md)
- [Docs Home](../README.md)
