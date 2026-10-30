# Notifications Feed

Parent: [Notifications Index](README.md)

## Overview

`/notifications` is the My Stream activity feed for the connected profile.
It resolves auth/profile prerequisites first, then shows a reverse-scroll list
with a multi-select cause filter, grouped reactions, and inline drop previews.

## Location in the Site

- Route: `/notifications`.
- Reached through `View all notifications` in the desktop sidebar inbox, or
  directly from mobile/app notifications navigation.
- Opened directly from URL, including `/notifications?reload=true`.

## Entry Points

- On desktop, select the sidebar bell to preview notifications, then choose
  `View all notifications` for the full feed. Mobile/app navigation opens the
  full feed directly.
- Open `/notifications` directly.
- Open `/notifications?reload=true` to force one refetch/read pass.

## Desktop Inbox

The desktop sidebar bell opens a floating inbox beside the sidebar while the
current page stays in place. Compact rows show the actor, activity, a short drop
preview when available, a timestamp, and an `Unread` indicator. The newest
notifications appear first; `Load more` retrieves older rows.

Opening or closing this inbox does not mark notifications read. Selecting a row
marks that notification read and opens its destination. `Mark all as read`
explicitly clears unread notifications. Read failures show an error and can be
retried; loading failures offer `Try again`. The empty inbox shows
`No notifications yet`.

Close the inbox with its close button, Escape, another bell click, or a click
outside. Escape returns focus to the bell. Changing accounts or routes closes
it. The inbox is also available when the desktop sidebar is collapsed.

The full `/notifications` page retains its automatic mark-read behavior and
provides filters, grouped reactions, and richer drop interactions.

## Before Rows Render

- Wallet session restoration or connection: a centered loading indicator
  remains visible while the site restores an existing wallet in a new tab or
  completes an active connect/reconnect attempt. The disconnected wallet prompt
  is shown only after that process finishes without valid auth.
- Wallet missing: `This content is only available to connected wallets.` with
  `Connect your wallet to continue.` and the wallet connect action.
- Wallet connected without a profile:
  `You need to set up a profile to continue.` with
  `Create a profile to access notifications.` and `Create profile`. The action
  opens the connected wallet's profile setup route.
- Profile loading: the same `Loading notifications` indicator used during route preparation and wallet restoration.
- Proxy profile active:
  `Notifications are not available while you are using a profile proxy.` with
  `Switch to primary profile`.
- Route preparation, wallet restoration, profile loading, and the initial feed fetch use one consistent `Loading notifications` indicator. There is no separate route shimmer before the feed loader.
- First-load failure: error copy with `Try again`.
- First-load timeout:
  `Loading notifications is taking longer than expected. Please try again.`
  with `Try again`.
- Empty state: `No notifications found` with `Explore Waves` and
  `Create a Wave`.

## Feed Filters

Unread counts keep their cached values while the Capacitor app is backgrounded
or a mobile browser tab is hidden. Periodic count refreshes resume on return.
Browser realtime notification delivery remains connected while the tab is hidden.

- On native iOS when the detected country is not `US` or is unknown, subscription
  coverage alerts, the Subscriptions filter, and the device's Subscription
  Coverage settings entry are hidden. Social follow notifications remain
  available. This concerns the app feed and controls, not previously delivered
  system push notifications.

- The app header supplies the visible `Notifications` title. Desktop and mobile
  web show the title beside the filter; the app keeps that page heading
  available to screen readers without repeating it visually.
- The filter presentation follows the app layout boundary:
  - mobile-layout viewports open `Filter notifications` in a bottom sheet;
  - wider viewports keep the compact anchored dropdown.
- Both presentations support selecting multiple notification categories at
  once and apply changes immediately. The mobile sheet stays open while users
  combine categories and provides a visible close action.
- The trigger defaults to `All`; one selected category shows its name, and
  multiple selected categories show the selected count. Closing and reopening
  the filter preserves the current selection. `All` clears category filters
  and returns to the complete feed.
- Escape from a desktop filter option closes the menu and returns keyboard
  focus to the trigger.
- The mobile sheet traps focus, blocks background feed interaction and
  scrolling, supports Escape/backdrop/close-button dismissal, restores focus
  to the trigger, scrolls internally on short viewports, and includes bottom
  safe-area padding. Resizing across the layout boundary closes the active
  presentation instead of opening a second filter surface.
- Filter mapping:
  - `All`: all notification causes, including priority alerts, all-drops rows,
    and unknown causes.
  - `Mentions`: mention and quote (`quoted you`) rows.
  - `Replies`: reply notifications.
  - `Identity`: new followers and REP/NIC updates.
  - `Reactions`: voted, reacted, and boosted drop notifications, plus returned voting credits.
  - `Invites`: wave-created notifications, including standard waves the user
    can access and direct-message waves started with the user.
  - `Subscriptions`: coverage alerts as a profile moves into plan-a-top-up,
    running-low, or action-required state.

## Row and Action Behavior

- Competition result notifications show a trophy beside “Results are in for”
  and the linked competition name, followed by a timestamp. The row wraps long
  names on mobile and desktop. The name opens the relevant competition or entry.

- Returned voting credit notifications name the submission and competition and
  show the amount released when a submission wins or its author permanently
  deletes it. They apply to competitions with a shared (`WAVE`) credit budget.
  Credits are reusable immediately in the same competition; notifications can
  arrive shortly afterward. The amount is the current allocation when released,
  including the absolute value of negative votes, rather than a time-weighted
  winning score or the sum of historical votes.
- A winning submission title opens its competition entry. After author deletion,
  the saved title stays visible as text and the competition name remains linked.
  Removing an already-winning entry does not return credits or notify a second
  time. Zero votes, submission edits, admin deletion and system cleanup do not
  create returned-credit notifications. Existing vote notification preferences
  apply to the feed and push delivery.

- Notifications are separated by spacing, and timestamps use secondary emphasis.
- Long profile names, wave names, rating categories, and fallback details wrap
  within the row. Keyboard focus visibly identifies profile and wave links and
  the `Show full drop` action.
- Drop-linked rows show inline drop context with reply/quote actions.
- Drop previews use the same solid dark card surface as My Stream and profile
  streams. Wave names appear below the author.
- Long drop previews can collapse and show `Show full drop`.
- Repeated `DROP_REACTED` notifications on one drop are grouped into one
  `New reactions` row with grouped avatars and reaction badges.
- Grouped reactions rows include batch follow action:
  `Follow All` or `Following All`.
- Header actions stay beside notification text when both remain readable and
  wrap below it when the available width is too narrow.
- Multi-actor reaction summaries keep their heading at the row edge while the
  batch action follows the same scan line as actor-notification actions.
- Priority alerts show `sent a priority alert 🚨` as:
  - header-only rows (no related drop), or
  - header plus first related drop preview.
- Standard wave-created rows say the creator made a wave the user can access
  and can include `Join wave` plus `Follow creator` controls.
- Direct-message wave-created rows say the creator started a DM with the user
  and expose `Open DM` instead of the wave join control.
- Subscription coverage rows show the severity, consecutive funded runway,
  funded-through or next-unfunded Meme context, an authoritative deadline when
  available, and an exact minimum top-up action when supplied.
- Coverage alerts are transition-based so routine balance recalculation does
  not repeatedly nag the user without a meaningful risk-state change.
- Unknown causes render a generic row (formatted cause/context) instead of
  failing feed render.

## Read, Paging, and Navigation

- Opening `/notifications` marks notifications read for the active authenticated
  profile.
- Rows still reported as unread show an `Unread` label and dot. A grouped
  reaction row is unread while any of its notifications is unread. The label
  disappears when refreshed notification data confirms they are read.
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
- An open feed reloads only its newest page for these events and keeps the older
  pages you already scrolled through; if the newest page does not connect to the
  loaded rows, for example after many new notifications at once, every loaded
  page is reloaded.
- Connected secondary accounts subscribe with their own stored JWTs and refresh
  only when the backend acknowledges those profile subscriptions.
- REST polling remains as a 30-second active-profile / 15-second
  connected-account fallback while realtime coverage is disconnected or
  unconfirmed. Covered profiles use a five-minute REST reconciliation poll to
  recover from any missed event.
- `PRIORITY_ALERT` and `ALL_DROPS` rows stay under `All` (no dedicated filter).
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
