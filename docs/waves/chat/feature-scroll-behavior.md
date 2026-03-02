# Wave Chat Scroll Behavior

## Overview

Wave chat keeps users anchored to the newest drops when they stay at the bottom,
and avoids forced jumps when they scroll up to read history.

On Apple mobile clients, new drops can queue behind a pending-message control
while users keep reading older content.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Main message list in wave and direct-message thread views.

## Entry Points

- Open any wave or direct-message thread.
- Scroll upward to read older messages.
- Stay at bottom while new drops arrive.
- Use the bottom control to return to latest or reveal pending drops.

## User Journey

1. Open a wave or direct-message thread.
2. The thread treats visual bottom as the live point for new drops.
3. Scroll upward to read older content; the app stops pinning and keeps your reading position.
4. Reach the top of loaded history; older pages load when available.
5. While older pages load, a thin loading bar appears at the top of the list.
6. Use bottom controls to return to latest and restore pinned behavior.
7. On Apple mobile while not pinned, new drops can stay pending until you reveal them.

## Common Scenarios

- Initial hydration shows a centered loader before message content renders.
- Empty threads show `Start the conversation`.
- While pinned, incoming drops keep the view at latest without manual action.
- While reading history, incoming drops do not force-scroll the list.
- On Apple mobile, pending and unread controls can appear together in a stacked control.
- Pending and unread count labels are compact and cap at `99+`.
- On non-Apple clients, incoming drops render immediately instead of a pending queue.

## Edge Cases

- Older-page loading requires both `hasNextPage` and at least 25 loaded drops.
- Layout changes can temporarily move pinned detection; pin state is recalculated
  as container metrics change.
- Temporary outgoing drops can trigger short auto-scroll while users are pinned.
- The message list uses a reverse flex layout, so visual bottom is the newest content.

## Failure and Recovery

- If loading older pages fails, already loaded drops stay visible; scroll up again
  or refresh.
- If pending/new-message controls appear out of sync, return to bottom and retry.
- If scroll state feels stale after major layout changes, refresh the thread.

## Limitations / Notes

- Pending queue/reveal behavior is Apple-mobile-only.
- Pending and unread controls are navigation aids, not a full unread-history UI.
- Keyboard and app-shell spacing behavior is documented in
  [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md).

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Serial Jump Navigation](feature-serial-jump-navigation.md)
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Drop Twitter/X Link Previews](../link-previews/feature-twitter-link-previews.md)
- [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md)
