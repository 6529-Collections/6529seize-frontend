# First-Message Wave Guidelines

## Overview

Wave guidelines are display-only creator guidance. When a wave has guidelines,
the composer asks a profile to review them before sending its first chat
message in that wave. This review is separate from participation rules that
require a wallet signature.

## Location in the Site

- Standard wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages/{waveId}` when that wave has guidelines
- The review opens from the wave composer immediately before the first chat
  message is sent.

## Entry Points

- Write and submit a new chat message in a wave with guidelines.
- Submit a reply or chat post with typed, non-whitespace text as the first post
  from that profile in the wave. Polls require typed question text and follow
  this first-message review flow. Attachment-only submissions keep their normal
  flow.

The review opens only when the profile has posted neither a chat message nor a
participation drop in the wave.

## User Journey

1. Write a message in the wave composer and submit it.
2. If the wave has guidelines and this is the profile's first post in the
   wave, a **Wave guidelines** dialog opens before the message is sent.
3. Read the creator-provided guidelines in the scrollable dialog.
4. Choose one of the two actions:
   - **Agree** closes the dialog and sends the pending message.
   - **Decline** closes the dialog without sending and keeps the draft.
5. After agreeing, the guidelines dialog does not interrupt later messages
   from that profile in the same wave.

## Common Scenarios

- If the profile has already sent a chat message, the composer submits later
  messages normally.
- If the profile has already posted a participation drop, its first later chat
  message is also submitted normally.
- If the wave has no guidelines, no review dialog appears.
- Participation-drop submission continues to use its normal flow. Guidelines
  do not introduce a signature or an extra dialog for that submission.

## Edge Cases

- Pressing Escape or dismissing the dialog has the same result as
  **Decline**: the message is not sent and the draft remains available.
- Declining does not record agreement. If the profile still has no posts in the
  wave, submitting the draft opens the guidelines again.
- The dialog keeps its header and actions visible while long guidelines scroll
  inside the available height. Its mobile layout respects the viewport and
  device safe areas.
- Guidelines are plain creator-provided text and retain their line breaks.

## Failure and Recovery

- The composer checks the current wave guidelines before the first message. If
  they cannot be loaded, the message is not sent and an error toast asks the
  user to try again.
- The draft remains in the composer after a load failure or decline, so the
  user can retry without recreating it.
- Normal message submission errors continue to use the composer's existing
  error and draft-recovery behavior after the user agrees.

## Limitations / Notes

- Guidelines are not signed with a wallet. Participation rules that require
  acceptance remain a separate signed flow for eligible participation drops.
- The first-post check combines the profile's chat-message count and
  participation-drop count for the active wave.

## Related Pages

- [Wave Composer Index](README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Creation Rules Step](../create/feature-rules-step.md)
- [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md)
