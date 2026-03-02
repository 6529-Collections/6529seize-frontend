# Wave Drop Composer Emoji Shortcodes

## Overview

Wave and direct-message composers convert valid `:emoji_id:` text to inline
emoji while you type. The same conversion also runs in inline drop edit mode.

## Location in the Site

- Wave thread composer: `/waves/{waveId}` (legacy `/waves?wave={waveId}`
  redirects here before the composer loads)
- Direct-message thread composer: `/messages?wave={waveId}` (no
  `/messages/{waveId}` route)
- Inline drop edit composer in wave and direct-message threads

## Entry Points

- Type shortcode text in the composer (`:emoji_id:`).
- Open the composer emoji picker and choose an emoji.
- Open edit mode on a drop that already has shortcode text.

## User Journey

1. Focus a wave, DM, or edit composer.
2. Type `:emoji_id:` or choose an emoji from the picker.
3. Native picker selections insert a native emoji character directly.
4. Custom picker selections insert `:id:` text.
5. The composer converts valid native/custom IDs to inline emoji.
6. After each conversion, the editor inserts a trailing space and keeps typing
   active.
7. Continue writing and submit (or save edit) normally.

## Common Scenarios

- `:smile:` and other valid native IDs convert inline.
- Valid 6529 custom IDs convert after the custom emoji catalog loads.
- Multiple valid shortcodes in one text run convert inline.
- Existing shortcode text in edit mode converts after editor content loads.
- On mobile, the picker opens in a full-screen dialog.

## Edge Cases

- Unknown shortcode IDs remain plain text.
- Partial shortcode text (for example `:emoji_id` without the closing `:`)
  remains plain text.
- Shortcode IDs are matched with word characters only (letters, numbers,
  underscore).
- If conversion runs while the caret is inside the shortcode text, the caret
  moves to the inserted spacing position so typing can continue.
- While custom emoji data is loading, custom IDs remain plain text.
- If custom emoji loading fails, custom IDs remain plain text while native IDs
  still convert.
- If one unsupported `:id:` appears before a valid shortcode in the same text
  run, later shortcodes in that run may not convert until the unsupported token
  is fixed or removed.

## Failure and Recovery

- If a shortcode does not convert, confirm exact `:emoji_id:` format and retry.
- If a valid shortcode still does not convert, remove unsupported shortcode text
  in the same run, then retry.
- If a custom emoji does not convert, reopen the picker and reselect the emoji
  or retry after network recovery.
- Unsupported or failed conversion does not block drop submission.

## Limitations / Notes

- Composer availability is documented separately in
  [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md).
- This page covers composer and edit input behavior, not drop reaction emoji
  controls.
- Desktop picker closes on outside click; mobile picker closes after selection
  or explicit close.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Reactions and Rating Actions](../drop-actions/feature-reactions-and-ratings.md)
- [Docs Home](../../README.md)
