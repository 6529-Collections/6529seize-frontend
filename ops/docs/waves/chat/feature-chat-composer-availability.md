# Wave Chat Composer Availability

## Overview

Composer availability is evaluated only after thread access checks pass.

Before a direct-message thread loads, routing can stop at:

- Connect wallet
- Set up profile
- `This content is not available`

Standard wave threads can still load read-only public content while wallet or
profile setup is incomplete. If the thread loads, the footer checks chat
availability. Submission availability is exposed through the Chat tab
`Submit drop` action.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages/{waveId}`
- Same footer rules in single-drop thread context (`drop={dropId}`)

## Footer States

- Composer visible: chat is allowed.
- Logged-out blocked panel: if chat is blocked because the viewer is not
  authenticated, footer shows
  `Connect your wallet to participate in this wave`.
- Profile setup blocked panel: if the wallet is authenticated but does not have
  a profile handle yet, footer shows
  `Create a profile to participate in this wave` with a `Create profile`
  action.
- Generic blocked panel: if chat is blocked for any other reason, footer
  shows `You cannot participate in this wave at the moment`.
- Closed-chat panel: if composer rendering reaches a chat-type wave with chat
  disabled, footer shows `Wave is closed`.

## Mode Rules

- Main chat composers use `DropMode.CHAT`.
- Dedicated submission panels use `DropMode.PARTICIPATION`.
- Chat composers do not render a chat/drop mode toggle.
- If submission is available, users enter it from `Submit drop` in the Chat tab
  header or app composer area.

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
- Most blocked panels are informational only; the profile setup blocked panel
  links to profile creation.
- When both chat and submission are blocked for non-auth reasons, messaging is
  generic, not reason-specific.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Composer Index](../composer/README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Drop Composer Enter-Key Behavior](../composer/feature-enter-key-behavior.md)
- [Wave Drop Actions Index](../drop-actions/README.md)
- [Docs Home](../../README.md)
