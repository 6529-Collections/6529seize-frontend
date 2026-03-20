# Wave Mentions

## Overview

Wave and direct-message composers support tracked wave mentions.

- Type `#` and at least 2 characters to search wave names.
- Select a result to insert a tracked mention token.
- Submitted mentions serialize as `#[wave_name_in_content]`.
- Posted mentions render as wave links to `/waves/{waveId}`.

## Location in the Site

- Wave thread composer: `/waves/{waveId}` (legacy `/waves?wave={waveId}`
  redirects here first)
- Direct-message thread composer: `/messages?wave={waveId}` (no
  `/messages/{waveId}` route)
- Inline `Edit Message` composer in these thread routes

## Entry Points

- Open a wave, DM, or edit composer.
- Type `#` plus a wave-name fragment (2+ characters).
- Select a wave from the suggestion menu with keyboard or pointer input.
- Submit the drop or save the edit.

## User Journey

1. Type `#` plus a wave name fragment.
2. The app fetches up to 5 matching non-DM waves.
3. Select a wave suggestion.
4. The composer inserts a wave mention token and tracks mention metadata.
5. Submit or save.
6. The posted mention renders as a wave link that opens `/waves/{waveId}`.

## Common Scenarios

- Mention another wave while posting in `/waves/{waveId}`.
- Mention a wave while chatting in `/messages?wave={waveId}`.
- Add a new wave mention while editing an existing drop.
- Open a rendered mention link to jump into the mentioned wave.

## Edge Cases

- Mention search runs only after at least 2 typed characters and returns
  non-DM waves only.
- Mention suggestions are disabled inside inline/fenced code.
- Mention suggestions are suppressed while slash-command trigger matching is
  active.
- If a selected wave name contains `]`, that character is removed from inserted
  mention text.
- Manually typed `#[name]` text without tracked metadata stays plain text after
  submit.
- Mention links show a small wave avatar only when the mentioned wave has a
  picture.

## Failure and Recovery

- If search returns no result, refine the name fragment and retry.
- If a posted `#[name]` stays plain text, open `Edit Message`, reselect the
  wave from mention suggestions, and save.
- If the wrong wave was inserted, reopen `Edit Message`, replace the mention
  from the `#` menu, and save.

## Limitations / Notes

- The suggestion menu shows at most 5 waves.
- Mention links require both mention text and matching `mentioned_waves`
  metadata.
- Untracked `#[name]` text renders as plain text.
- On touch devices, mention links do not show hover summary tooltips.
- Mention links always target `/waves/{waveId}`, including when authored from a
  DM thread.
- Composer eligibility and blocked-posting states are documented in
  [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Wave NFT Hashtag References](feature-nft-hashtag-references.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
