# Wave Chat Composer Availability

## Overview

Composer availability is evaluated only after thread access checks pass.

Before a thread loads, routing can stop at:

- Connect wallet
- Set up profile
- `This content is not available`

If the thread loads, the footer then checks chat and submission availability for
the current account.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Same footer rules in single-drop thread context (`drop={dropId}`)

## Footer States

- Composer visible: at least one mode is allowed.
- Generic blocked panel: if both modes are blocked, footer shows
  `You cannot participate in this wave at the moment`.
- Closed-chat panel: if composer rendering reaches a chat-type wave with chat
  disabled, footer shows `Wave is closed`.

## Mode Rules

- For `DropMode.BOTH`, footer picks an allowed mode automatically.
- If one mode is blocked and the other is allowed, composer stays available in
  the allowed mode.
- Mode toggle appears only on participatory waves in main thread view.
- Mode toggle is hidden in single-drop context and memes waves.
- When one mode is blocked, toggle cannot switch into the blocked mode.

## Edge Cases

- In app mode, if inline drop editing is active in the main thread, the footer
  composer is hidden until edit mode exits.
- Availability recalculates per wave. Switching threads can change footer state
  immediately.
- Existing drops, unread controls, and typing indicators continue to render
  while posting is blocked.

## Failure and Recovery

- If posting is unexpectedly blocked, verify wallet/profile access first.
- Check wave eligibility for chat and submission.
- Check submission window and per-user submission limits.
- Check whether chat is disabled for the current chat-type wave.
- If app edit mode is active and footer is hidden, exit edit mode.
- If state looks stale after changes, refresh the thread.

## Limitations / Notes

- This page covers availability only, not input formatting or submission
  syntax.
- Blocked panels are informational only; there is no inline permission
  escalation action.
- When both chat and submission are blocked, messaging is generic, not
  reason-specific.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Composer Index](../composer/README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Drop Composer Enter-Key Behavior](../composer/feature-enter-key-behavior.md)
- [Wave Drop Actions Index](../drop-actions/README.md)
- [Docs Home](../../README.md)
