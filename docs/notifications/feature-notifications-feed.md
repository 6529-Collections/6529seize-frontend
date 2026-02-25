# Notifications Feed

Parent: [Notifications Index](README.md)

## Overview

The `/notifications` route shows authenticated account activity inside My
Stream. The page resolves profile/auth prerequisites first, then renders a
reverse-scroll feed with cause filters, grouped reaction rows, priority alerts,
and in-place drop previews.

## Location in the Site

- Route: `/notifications`.
- Reached from the sidebar `Notifications` destination.
- Opened directly from the browser URL, including `?reload=true` refresh
  requests.

## Entry Points

- Select `Notifications` in app navigation.
- Open `/notifications` directly.
- Return after reconnecting wallet/auth when prompted by the page.

## Feature Details

- Profile and auth gating comes first:
  `Loading profile...`, wallet-connect prompt, handle-resolution recovery, and
  proxy-profile block (`Switch to primary profile`) can appear before feed rows.
- After prerequisites resolve, first load shows `Loading notifications...`.
- Cause filters are available as horizontal chips:
  `All`, `Mentions`, `Replies`, `Identity`, `Reactions`, `Invites`.
- Reaction notifications for the same drop are grouped into one
  `New reactions` row with reactor avatars, reaction badges, and one batch
  action (`Follow All` or `Following All`).
- Priority alerts render as `sent a priority alert 🚨` and can include either:
  - text-only header content, or
  - the first linked drop preview with the row action surface.
- Long notification drops can start compact with `Show full drop` for inline
  expansion.
- Older pages load from the top edge while preserving current rows in view, with
  `Loading older notifications...` feedback and a thin top loading bar.
- Empty results show `No notifications found` with `Explore Waves` and
  `Create a Wave` calls to action.

## Read and Navigation Behavior

- Opening `/notifications` marks the feed as read for the active authenticated
  profile.
- Opening a grouped reaction row drop marks grouped notification entries in that
  row as read.
- When users are active inside a wave/DM thread, only that active thread is
  auto-marked read; notifications for other threads remain unread until opened
  in thread context or reviewed in `/notifications`.
- Notification rows with linked drop context open the corresponding wave route
  at the selected serial context.

## Limitations / Notes

- Notifications are unavailable while users are in profile-proxy mode.
- Priority alerts currently appear inside the default feed and are included in
  the `All` scope (no dedicated priority-alert cause chip).
- Cause filters change only notification-list results; they do not affect other
  My Stream surfaces.
- Server prefetch warmup for `/notifications` can reduce first-load waiting
  after recent visits, but a full loading state can still appear after longer
  idle gaps.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
