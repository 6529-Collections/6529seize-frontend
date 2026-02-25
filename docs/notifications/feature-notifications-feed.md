# Notifications Feed

Parent: [Notifications Index](README.md)

## Overview

The `/notifications` route shows an authenticated feed of account activity in
My Stream. The screen first resolves profile/auth readiness, then lets users
filter by cause, receive and open priority alerts, and load older notification
pages while scrolling.

When multiple users react to the same drop, those events are combined into one
`New reactions` row. The row shows actor avatars, grouped reaction types, and a
single follow action for the grouped actors.

## Location in the Site

- Route: `/notifications`.
- Reached from the sidebar `Notifications` destination on desktop and small
  screens.
- Lives inside the My Stream layout, so notification actions can open full drop
  views and reply flows.

## Entry Points

- Select `Notifications` in the sidebar.
- Open `/notifications` directly.
- Return to `/notifications` after reconnecting wallet/auth when prompted.

## User Journey

1. Open `/notifications`.
2. If profile data is still resolving, the page shows `Loading profile...`.
3. If profile prerequisites are missing, the page shows reconnect guidance
   (`Connect your wallet to view notifications.` or profile-handle recovery).
4. If profile proxy mode is active, the page blocks the feed and offers
   `Switch to primary profile`.
5. Once ready, the page shows a centered `Loading notifications...` state until
   the first list result is available.
6. Review notification rows, including grouped reaction rows labeled
   `New reactions`.
7. In a `New reactions` row, review each reaction cluster and actor avatars; if
   useful, tap `Follow All` to follow the non-followed actors.
8. If a priority alert has a related drop, open that row to view the drop and jump
   to the drop context.
9. For notifications that include large drop previews, start with a compacted
   preview and use `Show full drop` if you need the entire drop inline.
10. Scroll upward to load older notifications; older rows are appended without
   replacing already visible content.
11. If a priority alert has no related drops, review the header text-only entry for
   who sent the alert and when.

## Common Scenarios

- Opening notifications and immediately narrowing the list with cause filters.
- Returning to `/notifications` soon after a recent visit and seeing rows
  immediately instead of a full-page loading flash.
- Opening `/notifications` during profile resolution and seeing
  `Loading profile...` before feed content appears.
- Opening `/notifications` with wallet/profile issues and using
  `Reconnect wallet` recovery actions.
- Seeing grouped reaction notifications for a single drop instead of separate
  duplicate rows.
- Using `Follow All` in a reaction group to follow multiple actors at once, or
  seeing `Following All` when everyone is already followed.
- Changing cause filters while current rows stay visible until refreshed filter
  results replace them.
- Loading older notifications while scrolling and seeing
  `Loading older notifications...` plus a thin loading bar at the top edge of
  the feed.
- Flick-scrolling on touch devices and continuing through the feed smoothly
  while older rows load.
- Opening a notification drop and navigating into the relevant wave thread.
- Each row with an associated identity now opens with a standardized header that
  includes the actor profile chip and follow action.
- Seeing a `sent a priority alert 🚨` notification row that includes a full linked
  drop preview and allows reply action.
- Selecting the reply control in a priority alert opens the related wave with
  the targeted serial context.
- Seeing a priority alert notification with no linked drop and still understanding who
  sent it from the text header.
- Staying at the newest end of the feed and seeing new rows remain in view
  without manual re-scrolling.
- Seeing `No notifications found` with `Explore Waves` / `Create a Wave` calls
  to action when the account has no notification rows.
- Expanding notification drops in-place with `Show full drop` to inspect long media
  posts or long text within a notification context.

## Edge Cases

- Filter chips can overflow horizontally; left/right controls appear so users
  can scroll the filter row.
- Large or media-heavy notification drops are initially shown in a compact
  preview with a short inline action (`Show full drop`) so list density remains high.
- If the route is opened with `?reload=true`, the feed performs a one-time
  refresh/read pass and then removes that query parameter.
- Changing the active cause filter resets list positioning to the newest edge
  for the selected filter result set.
- If wallet session exists but profile handle cannot be resolved, the page
  prompts `Reconnect wallet`.
- If profile proxy mode is active, notifications are blocked until users switch
  back to the primary profile.
- If users are not authenticated, the route shows wallet-connect guidance before
  notification content.
- If a notification arrives with an unrecognized cause, the row renders in the
  generic format (cause label, timestamp, and any available context) so the feed
  stays usable.
- Priority alerts currently appear in the feed by default and are included in the
  default `All` scope; they are not grouped under a dedicated cause chip yet.
- Inline follow actions in applicable rows follow the actor’s current follow state
  and remain in place while scrolling older notifications.
- Grouped reaction rows are created from all reaction notifications on the current
  page for the same drop.
- Identities without handles can still appear as reactors, but they are omitted from
  batch follow actions because profile follow requires a handle.

## Failure and Recovery

- If the initial fetch fails before any rows load, the page shows an error
  message with `Try again` instead of staying in a loading state.
- If loading takes too long (about 15 seconds) with no rows, the page switches
  to timeout messaging and retry action.
- Unauthorized fetch failures trigger re-authentication attempts; users can
  still retry from on-screen reconnect actions.
- If fetches fail after rows are already visible, existing rows stay in place
  and the failure is surfaced as toast messaging rather than replacing the feed
  with a full-page error state.
- If `Follow All` partly succeeds, successful follows apply and a single error toast
  lists failed requests.
- If a priority alert has no related drops, the row renders a text-only header
  with timestamp for immediate understanding.

## Limitations / Notes

- Notifications are unavailable while using a profile proxy.
- Full-page error/timeout states appear only when there are no visible rows.
- Cause filters apply only to the notifications list and do not change data in
  other My Stream sections.
- The route's server-side warmup treats notification data as fresh for about
  one minute, so first-load spinner behavior is more likely after longer idle
  gaps.
- Opening the notifications route marks notifications as read for the active
  authenticated profile.
- During live wave/DM activity, only the currently open thread is auto-marked
  as read; notifications from other threads remain unread until users open those
  threads or review them in `/notifications`.
- Opening a grouped reaction row drop marks all grouped reaction entries in that
  row as read.
- Long notification drops may start in a compact state; users can expand them
  inline to read full content and media.
- Batch follow actions can still partially fail when some profile follow endpoints
  return errors.
- Priority alerts render as `sent a priority alert 🚨` and show the first related
  drop when one is present.
- Priority alert reply action opens the related wave route at the selected serial
  context and preserves DM routing context.

## Related Pages

- [Notifications Index](README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Docs Home](../README.md)
