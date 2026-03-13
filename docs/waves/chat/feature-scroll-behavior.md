# Wave Chat Scroll Behavior

## Overview

Wave chat keeps you on the newest drops while you stay at bottom.
If you scroll up, it keeps your place and stops forced jumps.

On Apple mobile only, new drops can stay pending until you return to bottom.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Thread message list and floating bottom-right controls.

## Entry Points

- Open a wave or direct-message thread.
- Scroll up to read earlier drops.
- Reach the top of loaded history.
- Use the bottom control.

## User Journey

1. Open a wave or direct-message thread.
2. During initial hydration, the thread shows a centered loader.
3. If no drops exist, the thread shows `Start the conversation`.
4. While pinned at visual bottom, incoming drops keep the view at latest.
5. Scroll up to read history; the thread stops pinning and keeps your place.
6. At top of loaded history, older pages load when available and a thin top loading bar appears.
7. On Apple mobile while unpinned, newly arrived drops stay pending.
8. The bottom control behavior changes by state:
   - Pending drops: button reveals pending drops and returns to latest.
   - No pending drops: button returns to latest when you are away from bottom.
9. If unread control is also visible, unread and bottom controls render as a stacked pair.

## Common Scenarios

- On non-Apple clients, incoming drops render immediately instead of queuing.
- While reading history on any client, a bottom arrow control returns to latest.
- Pending and unread count labels cap at `99+` when shown as standalone controls.
- When unread and bottom controls are stacked, both render as icon controls.
- Temporary outgoing drops can trigger short auto-scroll when users are pinned.

## Edge Cases

- Older-page loading requires both `hasNextPage` and at least 25 loaded drops.
- Bottom control hides when you are at latest and no pending drops exist.
- Layout changes can shift pin detection briefly; pin state recalculates as container size changes.
- On Apple mobile, pending count starts from the newest visible serial when you leave bottom and clears after re-pin.

## Failure and Recovery

- If loading older pages fails, already loaded drops stay visible; scroll up again or refresh.
- If pending/new-message controls appear out of sync, return to bottom and retry.
- If scroll state feels stale after major layout changes, refresh the thread.

## Limitations / Notes

- Pending queue/reveal behavior is Apple-mobile-only.
- Bottom controls are navigation aids, not a full unread-history UI.
- Unread divider ownership and dismiss behavior are documented in
  [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md).
- Keyboard and app-shell spacing behavior is documented in
  [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md).

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Serial Jump Navigation](feature-serial-jump-navigation.md)
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md)
- [Wave Chat Typing Indicator](feature-typing-indicator.md)
- [Wave Chat Composer Availability](feature-chat-composer-availability.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md)
