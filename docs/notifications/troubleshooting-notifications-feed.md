# Notifications Feed Troubleshooting

Use this page when `/notifications` is blocked, rows look missing, or read/follow state looks wrong.

## Location in the Site

- Route: `/notifications`.
- Route variant: `/notifications?reload=true`.
- Rows can open wave or DM thread context.

## Quick Checks

1. Confirm prerequisites: connected wallet, resolved profile handle, and no active profile proxy.
2. Reopen `/notifications` and wait for `Loading profile...` then `Loading notifications...`.
3. Use the in-page recovery action if shown: `Reconnect wallet`, `Switch to primary profile`, or `Try again`.
4. Switch filter to `All` before treating rows as missing.
5. If you opened `/notifications?reload=true`, wait for the one-time refetch + mark-read pass.

## Blocked Access and Load Errors

- `Connect your wallet to view notifications.`:
  use `Reconnect wallet`.
- `We couldn't determine your profile handle. Please reconnect to continue.`:
  use `Reconnect wallet` to refresh account/profile resolution.
- `Notifications are not available while you are using a profile proxy.`:
  use `Switch to primary profile`.
- `Failed to load notifications. Please try again.`:
  use `Try again` on the page.
- `Loading notifications is taking longer than expected. Please try again.`:
  use `Try again`; if it repeats, reload the route.
- Unauthorized toast/error:
  let re-auth finish, then retry with `Try again`.
- `reload=true` behavior:
  if authenticated, it runs one refetch + mark-read pass and removes `reload`;
  if unauthenticated, it removes `reload` immediately.

## Missing or Stale Rows

- Filter chips only change `/notifications` results.
- `Priority Alert` and `All Drops` rows appear under `All` only.
- Repeated reactions on one drop can merge into one `New reactions` row.
- Unknown causes can show as a generic fallback row so feed rendering continues.
- Text-only priority alerts (no related drop) are expected.
- A `DROP_REACTED` row can be hidden if its emoji cannot be resolved.

## Follow and Read Behavior

- `Follow All` can partially succeed: successful follows stay applied, failures show error feedback.
- Opening `/notifications` marks notifications read for the active profile.
- Opening a grouped `New reactions` drop marks that group’s notification IDs read.
- Opening a wave/DM thread marks read for that wave/thread context only.
- If older-page loading fails after rows are visible, visible rows stay in place and failure appears as toast feedback.

## Limitations / Notes

- Notifications cannot be accessed while profile proxy mode is active.
- Full-page error and timeout states appear only when no rows are currently visible.
- Wave/thread read actions do not globally mark unrelated notifications as read.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Authenticated Live Updates](../realtime/feature-authenticated-live-updates.md)
