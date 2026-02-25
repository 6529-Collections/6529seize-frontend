# Notifications Feed Browsing Flow

## Overview

This flow covers opening `/notifications`, filtering the feed, reviewing rows
including grouped reactions and priority alerts, and loading older pages while
keeping current content visible.

## Location in the Site

- Route: `/notifications` in My Stream.
- Opened from app navigation or direct URL.
- Works across desktop and small-screen layouts that render My Stream.

## Entry Points

- Open `Notifications` from the sidebar.
- Navigate directly to `/notifications`.
- Return to `/notifications` after wallet/profile recovery prompts.

## User Journey

1. Open `/notifications`.
2. Resolve prerequisites if shown:
   `Loading profile...`, wallet connect prompt, handle recovery, or proxy
   profile block.
3. Wait for initial feed load (`Loading notifications...`).
4. Review newest rows at the current scroll position.
5. Optionally narrow rows with cause chips:
   `All`, `Mentions`, `Replies`, `Identity`, `Reactions`, `Invites`.
6. For grouped reaction activity, open a `New reactions` row to inspect
   reactors, reaction badges, and the associated drop preview.
7. Use `Follow All` when present to follow non-followed grouped actors, or see
   `Following All` when everyone in the group is already followed.
8. For long drop previews, use `Show full drop` to expand content inline.
9. For priority alert rows (`sent a priority alert 🚨`), review the text header
   and open linked drop context when available.
10. Scroll upward to load older pages; keep reading while
    `Loading older notifications...` appears.
11. Continue into wave/DM context from selected notification rows when deeper
    context is needed.

## Common Scenarios

- Filter to `Mentions` or `Replies` after opening the feed, then return to
  `All`.
- Expand a compact preview (`Show full drop`) before deciding to open the wave.
- Open a grouped reaction row and batch-follow involved actors from one action.
- Review a priority alert with no linked drop and continue in-feed without
  navigation.
- Reach the top sentinel and continue browsing older rows as they append.

## Edge Cases

- Filter chips can overflow horizontally; directional controls appear so users
  can continue accessing hidden chips.
- If `/notifications` opens with `?reload=true`, a one-time refresh is issued
  and the query parameter is removed after handling.
- Unknown/unclassified causes still render with generic row formatting so feed
  browsing remains usable.
- Priority alerts without related drops remain readable as text-only rows.

## Failure and Recovery

- If first load fails before any rows render, the page switches to error state
  and offers `Try again`.
- If loading stalls, timeout copy appears with retry action.
- If fetching older pages fails after rows are visible, visible rows remain and
  failure is surfaced without replacing feed content.
- If follow-all calls partially fail, successful follows remain and failure
  details are surfaced in toast feedback.

## Limitations / Notes

- Browsing behavior depends on authenticated profile readiness.
- Notifications unavailable in proxy mode cannot be bypassed from the feed.
- Filter scopes are notification-only and do not alter other route content.

## Related Pages

- [Notifications Index](README.md)
- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
