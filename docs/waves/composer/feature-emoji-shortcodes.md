# Wave Drop Composer Emoji Shortcodes

## Overview

Wave drop composers support inline emoji shortcode conversion. When users enter
a valid emoji ID in `:emoji_id:` format, the composer replaces it with an
inline emoji and keeps typing flow continuous.

## Location in the Site

- Wave detail threads: `/waves/{waveId}`
- Direct-message wave threads: `/messages?wave={waveId}`
- Drop edit composer for existing wave drops

## Entry Points

- Type an emoji shortcode directly in the drop composer.
- Pick an emoji from the composer emoji picker.
- Edit an existing draft or drop that includes shortcode-style emoji text.

## User Journey

1. Focus a wave drop composer (new drop or edit mode).
2. Enter shortcode text in `:emoji_id:` format.
3. When the shortcode matches a supported emoji ID, it converts to inline emoji.
4. The composer inserts a trailing space after the emoji.
5. Continue typing and submit normally.

## Common Scenarios

- Native emoji IDs such as `:smile:` convert inline.
- Custom 6529 emoji IDs convert inline when available in the emoji catalog.
- Emoji picker selections can produce the same inline result as typed
  shortcodes.
- Multiple valid shortcodes in the same draft can each convert inline.

## Edge Cases

- Unknown shortcode IDs stay as plain text and are not force-converted.
- Partial shortcode text (for example, missing the closing `:`) stays plain
  text until completed.
- If conversion happens while the caret is inside the shortcode, the caret is
  repositioned after the inserted emoji so typing can continue.

## Failure and Recovery

- If a shortcode does not convert, verify exact ID spelling and closing-colon
  format (`:emoji_id:`), then retry.
- If custom emoji data is unavailable, custom IDs remain plain text; users can
  continue composing and submit with text fallback.
- Failed or unsupported emoji conversion does not block drop submission.

## Limitations / Notes

- Conversion recognizes shortcode IDs that match supported native or custom
  emoji entries.
- Shortcode matching uses word-style IDs (letters, numbers, underscore).
- This page covers composer behavior, not drop reaction emoji controls.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Reactions and Rating Actions](../drop-actions/feature-reactions-and-ratings.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Docs Home](../../README.md)
