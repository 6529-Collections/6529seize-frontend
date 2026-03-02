# Wave Chat Typing Indicator

## Overview

Wave chat shows a live typing row when other participants are actively typing
in the current thread. The row uses a soft bottom gradient and animated dots
to stay readable above the composer area.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Bottom overlay of the thread message list

## Entry Points

- Open a wave or direct-message thread with loaded drops.
- Another participant starts typing in the same wave.
- Keep thread open while typing activity updates in real time.

## User Journey

1. Open a thread.
2. When another participant types, the typing row fades in.
3. Label text updates as typers join or stop typing.
4. If a typer submits a drop, their typing label clears.
5. If no new typing signal arrives for a short window, the row fades out.

## Common Scenarios

- One typer: `handle is typing`.
- Two typers: `handle1, handle2 are typing`.
- Three or more typers: `handle1, handle2 and N more people are typing`.
- Typers are ordered by participant level (highest first).
- The current viewer's own typing is not echoed back.

## Edge Cases

- Typing events for other waves are ignored.
- Switching waves clears current typing state.
- Muted waves disable typing subscription; no typing row is shown.
- If the thread is hydrating or empty, loading/empty states show instead of typing row.

## Failure and Recovery

- Invalid websocket payloads are ignored without blocking thread usage.
- If websocket traffic drops, typing labels expire on timeout and clear.
- Reconnect attempts are finite; after repeated failures, reopen thread later to resume updates.

## Limitations / Notes

- Typing status expires about 5 seconds after the latest typing signal.
- Label refresh runs on a short interval, so appearance/disappearance can lag briefly.
- This indicator is a lightweight activity signal, not guaranteed presence or delivery state.
- There is no dedicated typing-connection error banner.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Drop Composer Enter-Key Behavior](../composer/feature-enter-key-behavior.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Mobile Keyboard and Bottom Navigation Layout](../../navigation/feature-android-keyboard-layout.md)
- [Docs Home](../../README.md)
