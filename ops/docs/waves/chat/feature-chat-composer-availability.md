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
  authenticated, footer offers a blue
  `Sign in to 6529 to post` button. The helper explains that new users sign a
  wallet message, with no transaction or gas fees. The button opens the existing
  wallet chooser; connecting an unauthenticated wallet opens `Sign in to 6529`.
  Choose `Sign message` and confirm in your wallet. After sign-in, posting access
  is checked again; wallets without a profile still use profile setup.
- Profile setup blocked panel: if the wallet is authenticated but does not have
  a profile handle yet, footer shows
  `Create a profile to participate in this wave` with a `Create profile`
  action.
- Generic blocked panel: if chat is blocked for any other reason, footer
  shows `You cannot participate in this wave at the moment`.
- Closed-chat panel: if composer rendering reaches a chat-type wave with chat
  disabled, footer shows `Wave is closed`.
- `Chat` waves require chat to stay enabled, so their Settings and Rules panels
  do not show a `Chat status` enable/disable row.
- `Rank` and `Approve` wave Settings show `Chat status` as `Enabled` or
  `Disabled`. Wave admins can edit this row to re-enable disabled chat.
- The Rules panel separates `Chat status` from `Chat access` for `Rank` and
  `Approve` waves. `Chat access` names the audience independently of chat
  status; `Public` means no chat access group is attached.
- A private chat-access group that the viewer cannot inspect is shown as
  `Private group`, without a group link or identifying metadata.

## Mode Rules

- Main chat composers use `DropMode.CHAT`.
- Dedicated submission panels use `DropMode.PARTICIPATION`.
- Chat composers do not render a chat/drop mode toggle.
- If submission is available, users enter it from `Submit drop` in the Chat tab
  header or app composer area.
- The standard `Submit drop` dialog follows the app keyboard as it opens and
  closes. Long forms scroll within the remaining space, and focused composer
  or metadata fields are brought into view on touch devices.

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
- For `Rank` and `Approve` waves, check whether chat is disabled.
- If you can edit a `Rank` or `Approve` wave, open Settings -> Chat ->
  `Chat status` to re-enable chat.
- If app edit mode is active and footer is hidden, exit edit mode.
- If state looks stale after changes, refresh the thread.

## Limitations / Notes

- This page covers availability only, not input formatting or submission
  syntax.
- The signed-out panel opens sign-in, and the profile setup panel links to profile
  creation. Other blocked panels are informational.
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
