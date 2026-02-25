# Wave Chat Typing Indicator

## Overview

Wave chat shows a live typing indicator at the bottom of the message list when
other participants are actively composing text in the same wave. The indicator
uses a soft bottom gradient so typing text stays readable while blending into
the chat surface near the composer.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Bottom overlay of the wave message list, above the composer area

## Entry Points

- Open any wave or direct-message thread that already has drops.
- Another participant starts typing in the same wave.
- Continue reading the thread while incoming typing activity updates.

## User Journey

1. Open a wave thread.
2. When another participant starts typing, the typing row fades in with three
   animated dots and a text label.
3. The label updates as additional participants type.
4. If someone submits a drop, their typing status is removed.
5. If no fresh typing activity arrives for a short period, the indicator fades
   out automatically.

## Common Scenarios

- One participant typing: `handle is typing`.
- Two participants typing: `handle1, handle2 are typing`.
- Three or more participants typing: `handle1, handle2 and N more people are typing`.
- When multiple participants are typing, names are ordered by participant level
  (highest level first).
- The viewer's own typing activity is not echoed back in their own indicator.
- The indicator fades in/out and keeps a transparent-to-solid background edge,
  so the typing row remains legible without a hard visual seam in chat.

## Edge Cases

- Typing events from other waves are ignored.
- Switching to a different wave clears the previous typing indicator state.
- If typing state temporarily resolves to an empty label, the typing row stays
  hidden instead of showing animated dots without text.
- If the wave is muted for the current viewer, typing-status subscription is
  disabled and no typing indicator is shown.
- If a wave is muted while open, any visible typing label clears immediately.
  Unmuting starts a fresh typing session and only new typing events appear.
- If the thread is still hydrating or currently empty, loader/empty states are
  shown instead of the typing row.

## Failure and Recovery

- If live socket traffic drops temporarily, the thread remains usable and the
  typing indicator clears after its normal timeout window.
- Invalid or unsupported live payloads are ignored and do not block chat usage.
- When the socket reconnects, fresh typing activity repopulates the indicator.
- Reconnect attempts are finite; after repeated connection failures, users
  need to reopen the thread or return later to resume live typing updates.

## Limitations / Notes

- Typing status is short-lived and expires roughly 5 seconds after the last
  typing signal for each participant.
- Indicator text refresh runs on a short interval, so appearance/disappearance
  can lag by up to about one second.
- The indicator is a lightweight activity signal, not a guaranteed delivery or
  presence indicator.
- The UI does not show a dedicated typing-connection error message if typing
  updates stop after extended socket failures.

## Related Pages

- [Waves Index](../README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Drop Composer Enter-Key Behavior](../composer/feature-enter-key-behavior.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
