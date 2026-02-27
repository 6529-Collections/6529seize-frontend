# Notifications Feed

Parent: [Notifications Index](README.md)

## Overview

`/notifications` is the My Stream activity feed for the connected profile.
It resolves auth/profile prerequisites first, then shows a reverse-scroll list
with cause filters, grouped reactions, and inline drop previews.

## Location in the Site

- Route: `/notifications`.
- Reached from sidebar `Notifications`.
- Opened directly from URL, including `/notifications?reload=true`.

## Entry Points

- Select `Notifications` in app navigation.
- Open `/notifications` directly.
- Open `/notifications?reload=true` to force one refetch/read pass.

## Before Rows Render

- Wallet missing: `Connect your wallet to view notifications.` with
  `Reconnect wallet`.
- Profile loading: `Loading profile...`.
- Handle resolution failure:
  `We couldn't determine your profile handle. Please reconnect to continue.`
  with `Reconnect wallet`.
- Proxy profile active:
  `Notifications are not available while you are using a profile proxy.` with
  `Switch to primary profile`.
- Initial feed load: `Loading notifications...`.
- First-load failure: error copy with `Try again`.
- First-load timeout:
  `Loading notifications is taking longer than expected. Please try again.`
  with `Try again`.
- Empty state: `No notifications found` with `Explore Waves` and
  `Create a Wave`.

## Feed Filters

- Cause filters are horizontal chips:
  `All`, `Mentions`, `Replies`, `Identity`, `Reactions`, `Invites`.
- Filter mapping:
  - `All`: all notification causes, including priority alerts, all-drops rows,
    and unknown causes.
  - `Mentions`: mention and quote (`quoted you`) rows.
  - `Replies`: reply notifications.
  - `Identity`: new followers and REP/NIC updates.
  - `Reactions`: voted, reacted, and boosted drop notifications.
  - `Invites`: wave invite notifications.

## Row and Action Behavior

- Drop-linked rows show inline drop context with reply/quote actions.
- Long drop previews can collapse and show `Show full drop`.
- Repeated `DROP_REACTED` notifications on one drop are grouped into one
  `New reactions` row with grouped avatars and reaction badges.
- Grouped reactions rows include batch follow action:
  `Follow All` or `Following All`.
- Priority alerts show `sent a priority alert 🚨` as:
  - header-only rows (no related drop), or
  - header plus first related drop preview.
- Invite rows can include both identity follow and wave follow controls.
- Unknown causes render a generic row (formatted cause/context) instead of
  failing feed render.

## Read, Paging, and Navigation

- Opening `/notifications` marks notifications read for the active authenticated
  profile.
- Opening a grouped `New reactions` row drop marks that row's grouped
  notification IDs as read.
- Opening a drop context routes to the matching wave/DM thread with serial
  context.
- Opening a wave/DM thread marks notifications read for that wave only.
- Older pages load from the top edge with `Loading older notifications...` and
  a top progress bar.
- `/notifications?reload=true` triggers one refetch/read pass, then removes the
  `reload` query parameter.

## Limits and Notes

- Notifications are unavailable while users are in profile-proxy mode.
- `PRIORITY_ALERT` and `ALL_DROPS` rows stay under `All` (no dedicated chip).
- Cause filters only affect `/notifications` results.
- If auth expires, the page can trigger one re-auth request automatically after
  an unauthorized notifications error.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
