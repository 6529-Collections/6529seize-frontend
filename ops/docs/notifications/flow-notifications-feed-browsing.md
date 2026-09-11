# Notifications Feed Browsing Flow

## Overview

Use this flow to open `/notifications`, clear access gates, browse rows, and
load older notifications.

## Location in the Site

- Route: `/notifications` in My Stream.
- Variant: `/notifications?reload=true` runs one refresh + read pass.
- Open from app navigation or direct URL.

## Entry Points

- Open `Notifications` in app navigation.
- Open `/notifications` directly.
- Open `/notifications?reload=true` when feed data looks stale.
- Retry from state actions: `Reconnect wallet`, `Switch to primary profile`,
  `Try again`.

## Main Flow

1. Open `/notifications`.
2. Resolve access gates if shown:
   `Loading profile...`, `Reconnect wallet`, `Switch to primary profile`.
3. Wait for `Loading notifications...`.
4. When the feed opens, notifications are marked read for the active profile.
5. Browse newest rows.
6. Activate the filter control. Mobile-layout viewports open the
   `Filter notifications` bottom sheet; wider viewports open an anchored
   dropdown.
7. Select or deselect any combination of `Mentions`, `Replies`, `Identity`,
   `Reactions`, `Invites`, and `Subscriptions`. Changes apply immediately, and
   the mobile sheet remains open while selections change.
8. Choose `All` to clear category filters and show the complete feed. The
   trigger shows `All`, the single selected category, or the selected count.
9. Close the mobile sheet with its close button, Escape, or the backdrop.
   Reopening it preserves the current selection.
10. Open rows to inspect drop context or actor activity.
11. For grouped `New reactions` rows, review
   reactors, reaction badges, and the related drop preview.
12. Use `Follow All` when present, or see
   `Following All` when everyone in the group is already followed.
13. Open drop content to route into wave or DM context with serial context.
14. For grouped reactions, opening the related drop marks grouped
    notification IDs as read.
15. Use `Show full drop` for long inline previews.
16. Priority alerts (`sent a priority alert 🚨`) can be:
    text-only, or text plus one drop preview.
17. Scroll upward to load older pages. `Loading older notifications...` and a
    top progress bar appear while current rows stay visible.
18. If no rows are available, use `Explore Waves` or `Create a Wave` from the
    empty state.

## Edge Cases

- If authenticated, `/notifications?reload=true` runs one refetch + mark-read
  pass, then removes `reload` from the URL.
- If unauthenticated, `/notifications?reload=true` removes `reload` without
  running that pass.
- Opening a wave/DM thread from a notifications row triggers wave-level read
  sync; after successful read sync, notifications queries invalidate so unread
  indicators refresh for the active account.
- Unknown causes render with a generic row so feed browsing continues.
- Priority alerts without related drops stay text-only.
- Resizing across the mobile/desktop layout boundary dismisses an open filter
  surface and returns focus to the trigger.

## Failure and Recovery

- First-load failure with no rows: error state with `Try again`.
- First-load timeout with no rows: timeout copy with `Try again`.
- Unauthorized notifications error can trigger one automatic re-auth attempt.
- If older-page fetch fails after rows are visible, current rows stay visible
  and failure feedback is shown.
- If `Follow All` partially fails, successful follows stay applied and failed
  requests surface error feedback.

## Limitations / Notes

- Feed access requires wallet + profile readiness.
- Notifications are blocked in proxy profile mode until you switch back.
- Filters only change `/notifications` results and do not change notification
  read state, paging, or navigation behavior.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
