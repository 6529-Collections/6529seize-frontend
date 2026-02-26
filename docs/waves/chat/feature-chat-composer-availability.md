# Wave Chat Composer Availability

## Overview

Chat waves can be marked as closed before submission. In that state, the composer area does
not show the normal message input; instead users see a closed-state banner so the thread stays
read-only.

## Location in the Site

- Public or group chat waves: `/waves/{waveId}`
- Direct-message chat threads: `/messages?wave={waveId}`
- Composer section at the bottom of thread view

## Entry Points

- Open a chat wave where posting is disabled.
- Open a direct-message thread that is currently not accepting chat drops.
- Open any other wave thread to compare composer behavior between open and closed states.

## User Journey

1. Open the wave or direct-message thread.
2. If `wave.type === Chat` and chat is disabled, the composer block is replaced by:
   - `Wave is closed`
3. Existing drops remain visible and ordered as usual.
4. Reply and new-drop actions are not available while this banner is shown.
5. Returning to an open wave or different thread returns the normal composer controls.

## Common Scenarios

- During temporary closure windows, users can read existing conversation context but cannot
  add new drops.
- The closed state does not alter reaction, profile, or link-preview behavior for existing
  drops already loaded in the thread.
- When a thread is reopened later, normal composer controls return.

## Edge Cases

- This state is limited to chat-type waves; non-chat drop modes still use their normal
  composer behavior.
- The closed-state banner appears only for threads where chat is explicitly disabled.
- Some thread-level chrome may still show metadata or navigation controls even when posting is
  unavailable.

## Failure and Recovery

- If the closed state appears unexpectedly, users can refresh the thread to re-sync wave metadata.
- If users switch to another thread, composer state resets according to that thread's own open/closed
  config.

## Limitations / Notes

- The banner does not provide a manual reopen action in the UI.
- There is no separate prompt for when the wave will reopen unless that information is surfaced
  elsewhere in the thread or wave details.

## Related Pages

- [Wave Chat Index](./README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Typing Indicator](feature-typing-indicator.md)
- [Wave Drop Composer Enter-Key Behavior](../composer/feature-enter-key-behavior.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
