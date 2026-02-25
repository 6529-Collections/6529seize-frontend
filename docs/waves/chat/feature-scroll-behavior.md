# Wave Chat Scroll Behavior

## Overview

Wave chat keeps users anchored to the newest messages when they are already at the
bottom, while avoiding forced jumps when they scroll away to read older content.
Pinning decisions are re-checked as list position and container layout change.
On iOS and Android clients, chat layout height is recalculated while the keyboard
is open to avoid extra bottom whitespace and keep the composer in the visible
viewport.

On Apple mobile clients, newly arrived messages can be queued as pending while
users keep reading older messages.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Main message list in wave and DM chat views.

## Entry Points

- Open any wave from the waves list.
- Open a direct message thread.
- Scroll upward in a busy thread to load older messages.
- Use the bottom jump control while reading older content.

## User Journey

1. Open a wave or direct-message thread.
2. The chat loads newest messages first and treats the bottom as the live point.
3. Scroll upward to read older content; older pages load as you reach the top of
   the loaded window.
4. If you are pinned to the bottom, incoming messages keep the view at the newest
   message.
5. If you are reading older content, chat keeps your reading position and avoids
   forced auto-jumps.
6. On Apple mobile clients, new messages can queue behind the bottom control; using
   that control reveals queued messages and re-pins to latest.

## Common Scenarios

- While pinned, incoming messages continue in place with no manual action.
- Tapping the bottom jump control returns immediately to latest and restores pinned
  behavior.
- While older pages are loading, a thin loading bar appears above the oldest loaded
  messages and clears when that page finishes.
- If pending message count is large on Apple mobile, the control label caps at
  `99+`.
- While composing on mobile with keyboard open, the scroll container contracts so
  composing does not leave a trailing blank area.

## Edge Cases

- Layout shifts (keyboard open/close, media load, container resize) can temporarily
  change pinned detection; chat waits for bottom confirmation before re-pinning.
- Older-page loading is available only when the feed has at least 25 loaded drops
  and more pages are available.
- On non-Apple clients, pending messages are not hidden behind a pending counter.

## Failure and Recovery

- During initial hydration, users see a loading spinner instead of an empty state.
- If loading older messages fails, already loaded messages remain visible; users can
  retry by scrolling again or refreshing.
- If container height changes while reading older messages, chat keeps the current
  reading position until users return to pinned threshold.

## Limitations / Notes

- Auto-scroll for incoming temporary drops occurs only while users are pinned.
- Pending-message queue/reveal behavior is Apple-mobile-specific.
- Pending counter is a compact indicator, not a full unread history UI.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Serial Jump Navigation](feature-serial-jump-navigation.md)
- [Wave Chat Unread Divider and Jump Controls](feature-unread-divider-and-controls.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Drop Twitter/X Link Previews](../link-previews/feature-twitter-link-previews.md)
- [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md)
