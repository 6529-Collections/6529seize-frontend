# Wave Chat Scroll Behavior

## Overview

Wave chat keeps users anchored to the newest messages when they are already at the
bottom, while avoiding forced jumps when they scroll away to read older content.
On Apple mobile clients, newly arrived messages can be queued as pending while
users continue reading older messages.
When users jump to a specific drop serial, chat also briefly highlights the
targeted drop so it is easier to locate in the list.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- This behavior applies to the main message list in wave chat views.

## Entry Points

- Open any wave from the waves list.
- Open a direct message thread.
- Follow a shared wave link, including links that target a specific message
  serial (for example `serialNo=...`).
- Use in-thread jump actions that target a specific serial number (for example
  search results, unread controls, or boosted/activity jump actions).

## User Journey

1. Open a wave or direct-message thread.
2. The chat loads newest messages first and shows the list bottom as the live
   point.
3. Scroll upward to read older messages; older pages load as you reach the top of
   the loaded list.
4. If you are pinned to the bottom, incoming temporary posts keep the view at
   the newest message.
5. If you are reading older content, chat stays at your reading position instead
   of auto-jumping.
6. If the thread opens (or jumps) to a targeted serial number, chat scrolls to
   that drop and applies a temporary highlight that fades out.
7. On Apple mobile clients, when you are not at the bottom and new messages
   arrive, a counter appears on the bottom control and tapping it reveals pending
   messages, then re-pins to latest.

## Common Scenarios

- While pinned at bottom, new incoming/outgoing messages continue in place with
  no manual action.
- While reading older messages, chat stays at your reading position instead of
  auto-jumping.
- While older pages are loading, a thin loading bar appears above the oldest
  loaded messages and clears when that page finishes loading.
- When jumping to a targeted serial number, the target drop is briefly
  highlighted to help users confirm they reached the intended message.
- On Apple mobile clients, newly arrived messages can be held behind a pending
  counter; tapping the bottom control reveals them and re-pins to latest.
- If pending message count is large, the control label caps at `99+`.
- While reading older content on Apple mobile, the most recently visible serial
  remains visible while newer serials queue as pending.

## Edge Cases

- If both unread and pending-message controls are active, controls are combined
  into a stacked button group.
- Older-page loading is only available when the feed already has at least 25
  loaded drops and more pages are available.
- If the target drop is still loading/off-screen when a serial jump begins, the
  temporary highlight can remain visible as the target comes into view.
- On non-Apple clients, pending messages are not hidden behind a pending counter.

## Failure and Recovery

- During initial feed hydration, users see a loading spinner (with polite
  loading-status announcement for assistive technology) instead of an empty
  state.
- If the chat has no drops, users see the empty placeholder state.
- If loading older messages fails, already loaded messages remain visible; users
  can retry by scrolling again or refreshing.
- If a targeted jump/scroll operation stalls, the temporary scrolling overlay
  clears automatically and normal chat interactions continue.
- In environments with limited browser observer support, serial-target jumps still
  complete and targeted-drop highlighting remains temporary.

## Limitations / Notes

- Auto-scroll for temporary drops occurs only when the user is pinned to the
  bottom.
- Pending-message hiding/reveal behavior is Apple-mobile-specific.
- Pending-message count is a compact indicator, not a full unread history.
- Targeted-drop highlighting appears only for explicit serial-target jumps and
  fades out automatically.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Chat Typing Indicator](feature-typing-indicator.md)
- [Profiles Index](../../profiles/README.md)
- [Profile Brain Tab](../../profiles/tabs/feature-brain-tab.md)
- [Loading Status Indicators](../../shared/feature-loading-status-indicators.md)
- [Android Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md)
