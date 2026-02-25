# Wave Chat Scroll Behavior

## Overview

Wave chat keeps users anchored to the newest messages when they are already at the
bottom, while avoiding forced jumps when they scroll away to read older content.
On Apple mobile clients, newly arrived messages can be queued as pending while
users continue reading older messages.
Pinning decisions are re-checked as the list position and container layout change.
That means temporary layout shifts (such as keyboard open/close states or dynamic
content changes) can change whether the list is considered pinned without forcing
unexpected jumps.
On Android and iOS mobile clients, chat layout height is recalculated while the
keyboard is open to avoid extra bottom whitespace and keep the composer area in
the usable viewport.
If a wave opens with unread metadata, the message list can also show a `New
Messages` divider at the unread boundary.
A floating control jumps to that point and keeps unread navigation available while
users read older messages.
If unread navigation and pending-message reveal are both active, the controls are
shown together in a compact stacked pair near the bottom to keep both actions
reachable.
Jumps can resolve targets outside the currently loaded message window by loading
a focused set of surrounding drops first.
During jump and top-pagination flows, long embedded Twitter/X previews can enter
as compact cards with an inline `Show full tweet` action so message insertion is
less disruptive.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- This behavior applies to the main message list in wave chat views.

## Entry Points

- Open any wave from the waves list.
- Open a direct message thread.
- Follow a shared wave link, including links that target a specific message
  serial (for example `serialNo=...`).
- Use in-thread jump actions that target a specific serial number (for example
  search results, unread controls, or boosted/activity jump actions).
- Use boosted-drop cards in the message list to jump directly to a trending post.

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
   If needed, surrounding drops are loaded so the target can become visible.
7. If long Twitter/X tweet previews arrive with newly loaded jumps or page fetches,
   they can render compactly first and expand with `Show full tweet`.
8. If the thread opens with unread context, a divider and floating jump control
   mark the first unread boundary.
9. On Apple and Android mobile clients, when you are not at the bottom and new
   messages arrive, a counter appears on the bottom control and tapping it reveals
   pending messages, then re-pins to latest.

## Common Scenarios

- While pinned at bottom, new incoming/outgoing messages continue in place with
  no manual action.
- Tapping the bottom jump control from a reading position returns immediately to
  the latest message and restores pinned scroll behavior.
- While reading older messages, chat stays at your reading position instead of
  auto-jumping.
- While older pages are loading, a thin loading bar appears above the oldest
  loaded messages and clears when that page finishes loading.
- When jumping to a targeted serial number, the target drop is briefly
  highlighted to help users confirm they reached the intended message.
- With unread context, the divider row marks where new content starts, and the
  jump control points to that serial boundary.
- On Apple and Android mobile clients, newly arrived messages can be held behind
  a pending counter; tapping the bottom control reveals them and re-pins to latest.
- If pending message count is large, the control label caps at `99+`.
- While reading older content on Apple mobile, the most recently visible serial
  remains visible while newer serials queue as pending.
- If unread and pending controls are both active, they are combined so both actions
  remain reachable from one area.
- The unread jump control can be dismissed by swiping it right or pressing Escape.
  When dismissed, chat navigation continues normally and the control stays away
  until unread context changes.
- If a thread opens from a link with `serialNo` plus `divider`, the divider context
  is applied and those query params are cleared after initialization.
- If a thread opens with only `serialNo`, the divider still uses the current unread
  boundary when available.

## Edge Cases

- If both unread and pending-message controls are active, controls are combined
  into a stacked button group.
- If layout changes move the message list briefly while reading older messages, the
  chat waits to re-pin until bottom position is confirmed again.
- Older-page loading is only available when the feed already has at least 25
  loaded drops and more pages are available.
- If a jump target is outside the currently loaded window, the chat requests the
  target range and may fetch multiple historical pages before the target becomes
  visible.
- If a long compacted tweet preview is loaded during a jump, users can expand it
  in place.
- If the target drop is still loading/off-screen when a serial jump begins, the
  temporary highlight can remain visible as the target comes into view.
- On non-Apple clients, pending messages are not hidden behind a pending counter.
- On mobile app clients with keyboard focus, the scroll container contracts so
  composing does not force an extra trailing blank area.
- If both controls are active together, they can appear as a compact stacked control
  cluster at the bottom instead of two separate overlays.

## Failure and Recovery

- During initial feed hydration, users see a loading spinner (with polite
  loading-status announcement for assistive technology) instead of an empty
  state.
- If the chat has no drops, users see the empty placeholder state.
- If loading older messages fails, already loaded messages remain visible; users
  can retry by scrolling again or refreshing.
- If a targeted jump/scroll operation stalls, the temporary scrolling overlay
  clears automatically and normal chat interactions continue.
- If container height changes or images load asynchronously while you are reading
  older messages, the chat keeps your current reading position until you return to
  the pinned threshold.
- In environments with limited browser observer support, serial-target jumps still
  complete and targeted-drop highlighting remains temporary.
- If `serialNo` jump params fail to target visible data immediately, or `divider`
  is absent/invalid, users can continue reading while the jump control remains
  available as data resolves.

## Limitations / Notes

- Auto-scroll for temporary drops occurs only when the user is pinned to the
  bottom, and the bottom jump control always re-pins to the latest message.
- Pending-message hiding/reveal behavior is Apple-mobile-specific.
- Pending-message count is a compact indicator, not a full unread history.
- Targeted-drop highlighting appears only for explicit serial-target jumps and
  fades out automatically.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Chat Typing Indicator](feature-typing-indicator.md)
- [Wave Drop Boosting](../drop-actions/feature-drop-boosting.md)
- [Profiles Index](../../profiles/README.md)
- [Profile Brain Tab](../../profiles/tabs/feature-brain-tab.md)
- [Loading Status Indicators](../../shared/feature-loading-status-indicators.md)
- [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md)
- [Wave Drop Twitter/X Link Previews](../link-previews/feature-twitter-link-previews.md)
