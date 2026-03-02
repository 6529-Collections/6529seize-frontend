# Wave Chat Composer Availability

## Overview

The thread composer is shown only when current wave state and user permissions allow posting.
When posting is unavailable, the composer area switches to a status panel instead of input fields.

For chat-type waves with chat disabled, that panel text is `Wave is closed`.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Sticky composer area at the bottom of thread view

## Entry Points

- Open a thread where chat posting is enabled.
- Open a thread where chat posting is disallowed for your profile.
- Open a chat-type thread where chat has been closed by wave config.
- In app mode, edit an existing drop in-thread and return to normal compose state.

## User Journey

1. Open a wave or direct-message thread.
2. The app checks posting eligibility and chat availability for this wave.
3. If posting is available, normal composer controls render.
4. If posting is not available, the composer area renders an unavailable-state panel.
5. If the wave is chat-type and chat is disabled, the panel text is `Wave is closed`.
6. Existing drops stay readable in the same thread.

## Common Scenarios

- Chat is open: users can post from the normal composer.
- Posting is disallowed for the current profile: composer area shows an unavailable-state message.
- Chat is closed for a chat-type wave: thread is read-only and composer shows `Wave is closed`.
- In app mode during inline drop edit, the main thread composer hides until edit mode exits.

## Edge Cases

- Composer state is recalculated per wave; switching threads can immediately change availability.
- Closed-state messaging applies only when chat-type waves have chat explicitly disabled.
- Route-level auth/profile gates can block thread rendering before composer rules are evaluated.
- Unread controls, typing indicator, and drop content keep their own behavior while composer is unavailable.

## Failure and Recovery

- If composer state looks stale after permission/wave changes, refresh the thread.
- If a thread opened from stale list metadata, leave and reopen the thread.
- If posting is unexpectedly unavailable, verify auth/profile eligibility first.

## Limitations / Notes

- This page covers composer availability, not input-formatting rules.
- There is no inline reopen/permission escalation action in this panel.
- Create-wave and create-DM modal behavior is documented in Waves Create docs.

## Related Pages

- [Wave Chat Index](./README.md)
- [Wave Composer Index](../composer/README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Drop Composer Enter-Key Behavior](../composer/feature-enter-key-behavior.md)
- [Wave Drop Actions Index](../drop-actions/README.md)
- [Docs Home](../../README.md)
