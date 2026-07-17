# Notifications Feed

Parent: [Notifications Index](README.md)

## Overview

`/notifications` is the My Stream activity feed for the connected profile.
It resolves auth/profile prerequisites first, then shows a reverse-scroll list
with cause filters, grouped reactions, and inline drop previews.

## Location in the Site

- Route: `/notifications`.
- Reached from the connected-only web sidebar `Notifications` row near the
  account area, or from app notifications navigation.
- Opened directly from URL, including `/notifications?reload=true`.

## Entry Points

- Select `Notifications` from the connected web sidebar row or app navigation.
- Open `/notifications` directly.
- Open `/notifications?reload=true` to force one refetch/read pass.

## Before Rows Render

- Wallet session restoration or connection: a centered loading indicator
  remains visible while the site restores an existing wallet in a new tab or
  completes an active connect/reconnect attempt. The disconnected wallet prompt
  is shown only after that process finishes without valid auth.
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
  - `Invites`: wave-created notifications, including standard waves the user
    can access and direct-message waves started with the user.

## Row and Action Behavior

- Drop-linked rows show inline drop context with reply/quote actions.
- Long drop previews can collapse and show `Show full drop`.
- Repeated `DROP_REACTED` notifications on one drop are grouped into one
  `New reactions` row with grouped avatars and reaction badges.
- Grouped reactions rows include batch follow action:
  `Follow All` or `Following All`.
- Header actions stay beside notification text when both remain readable and
  wrap below it when the available width is too narrow.
- Priority alerts show `sent a priority alert 🚨` as:
  - header-only rows (no related drop), or
  - header plus first related drop preview.
- Standard wave-created rows say the creator made a wave the user can access
  and can include `Join wave` plus `Follow creator` controls.
- Direct-message wave-created rows say the creator started a DM with the user
  and expose `Open DM` instead of the wave join control.
- Unknown causes render a generic row (formatted cause/context) instead of
  failing feed render.

## Read, Paging, and Navigation

- Opening `/notifications` marks notifications read for the active authenticated
  profile.
- When the active identity changes (for example after account/profile switch),
  the feed query does not reuse previous-profile rows as placeholder data.
- During switch-account handoff between already known connected accounts,
  notifications stay scoped to the stored active account until the new account
  settles, preventing transient rows from an interim provider account.
- Opening a grouped `New reactions` row drop marks that row's grouped
  notification IDs as read.
- Opening a drop context routes to the matching wave/DM thread with serial
  context.
- Opening a wave/DM thread marks notifications read for that wave only.
- After a successful wave/DM read request, notifications queries are
  invalidated so unread indicators can refresh for the active account without
  reopening `/notifications`.
- Older pages load from the top edge with `Loading older notifications...` and
  a top progress bar.
- `/notifications?reload=true` triggers one refetch/read pass, then removes the
  `reload` query parameter.

## Limits and Notes

- Notifications are unavailable while users are in profile-proxy mode.
- While the authenticated websocket is healthy, recipient-scoped invalidation
  events refresh the active notification feed and unread indicators without
  waiting for the previous 30-second poll. The event contains only the target
  profile ID; notification rows remain REST-authoritative.
- Connected secondary accounts subscribe with their own stored JWTs and refresh
  only when the backend acknowledges those profile subscriptions.
- REST polling remains as a 30-second active-profile / 15-second
  connected-account fallback while realtime coverage is disconnected or
  unconfirmed. Covered profiles use a five-minute REST reconciliation poll to
  recover from any missed event.
- `PRIORITY_ALERT` and `ALL_DROPS` rows stay under `All` (no dedicated chip).
- Cause filters only affect `/notifications` results.
- If auth expires, the page can trigger one re-auth request automatically after
  an unauthorized notifications error.

### Localization fallback debt

- Route or component: `/notifications` wallet connection loader.
- Untranslated surface: the loader's accessible status label.
- Current fallback behavior: all supported locales use the canonical `en-US`
  `Loading notifications` status while this route has no local message family.
- User impact: the loading state remains accessible and functional, but its
  announcement is English-only.
- Owner or follow-up issue: frontend i18n backlog.
- Expected remediation path: move the notifications loading and recovery copy,
  including accessible names, into one shared message family and verify its
  fallback behavior across all supported locales.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
