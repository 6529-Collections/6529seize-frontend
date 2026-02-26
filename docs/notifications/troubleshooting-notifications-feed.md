# Notifications Feed Troubleshooting

## Overview

Use this page when `/notifications` does not load as expected, rows fail to
refresh, or follow/read behavior appears inconsistent.

## Location in the Site

- Route: `/notifications`.
- Notification rows that open wave or DM context.
- Live read-state updates connected to active thread sessions.

## Entry Points

- Feed never leaves loading or prerequisite state.
- Error or timeout messaging appears on first load.
- Older-page loading fails while scrolling.
- `Follow All` or row follow actions do not fully apply.
- Read indicators look stale after opening notifications or thread context.

## User Journey

1. Confirm account prerequisites:
   wallet connected, profile handle resolvable, and profile proxy disabled.
2. Reopen `/notifications` and wait through profile + feed loading states.
3. If blocked, use the provided recovery action:
   `Reconnect wallet`, `Switch to primary profile`, or `Try again`.
4. If opened via `?reload=true`, allow the one-time refresh pass to complete.
5. Retry the specific action (filter switch, row open, follow action, or older
   pagination).

## Common Scenarios

- `Connect your wallet to view notifications.` appears:
  reconnect wallet, then retry route entry.
- Handle-resolution prompt appears (`We couldn't determine your profile
  handle...`):
  use `Reconnect wallet` to refresh account/profile resolution.
- Proxy block appears (`Notifications are not available while you are using a
  profile proxy.`):
  use `Switch to primary profile`.
- Initial fetch error appears with `Try again`:
  retry from the error state without leaving the route.
- Timeout message appears:
  retry from timeout state; if still failing, refresh route session.
- Older-page load fails after rows are already visible:
  keep browsing visible rows and retry loading older pages from top edge.

## Edge Cases

- Partial follow success can occur when some profile follow calls fail; successful
  follows still persist.
- Grouped reactions and priority alerts can be present together on the same
  result page.
- Text-only priority alerts (no related drop) are expected behavior, not a data
  loss state.

## Failure and Recovery

- No rows + fetch failure:
  page-level error copy is shown with retry action (`Try again`).
- No rows + long load duration:
  timeout copy is shown with retry action.
- Rows already visible + subsequent fetch failure:
  feed content stays in place and failure is surfaced via toast messaging.
- Batch follow partial failure:
  completed follows remain, with error feedback for failed requests.
- Read state confusion:
  reopen `/notifications` to trigger feed read pass; open the specific wave/DM
  thread to mark that thread's notifications as read when needed.

## Limitations / Notes

- Notifications cannot be accessed while profile proxy mode is active.
- Full-page error and timeout states are only used when no rows are currently
  visible.
- Active-thread auto-read applies only to the currently open thread; it does not
  globally mark unrelated thread notifications as read.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Authenticated Live Updates](../realtime/feature-authenticated-live-updates.md)
