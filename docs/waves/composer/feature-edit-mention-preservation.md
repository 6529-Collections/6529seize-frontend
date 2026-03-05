# Wave Drop Edit Mention Preservation

## Overview

When you open `Edit Message`, existing user and wave mentions are restored as
mention tokens instead of plain text. You can rewrite around mentions without
rebuilding them.

## Location in the Site

- Wave detail threads: `/waves/{waveId}`
- Direct-message wave threads: `/messages?wave={waveId}`
- Drop action menus where `Edit Message` is available

## Entry Points

- Open a drop action menu and select `Edit Message`.
- Edit is shown only for your own non-participatory drops.
- Start from a drop that already contains `@[handle]`, `#[wave_name]`, or both.

## User Journey

1. Open edit mode for a drop.
2. The editor loads current content, restores mention tokens, and places the
   caret at the end.
3. Continue typing. Mention suggestion menus still work for new user and wave
   mentions.
4. Save behavior depends on surface:
   - desktop web: press `Enter`, or click `save`
   - mobile web and app: use `save`/`Save` buttons (`Enter` does not submit)
   - use `Shift+Enter` for a newline
5. If content is unchanged after normalization, edit mode closes without an
   update request.
6. If content changed, edit mode closes immediately and sends the update
   request.
7. After success, the updated content appears and the drop shows `(edited)`.

## Edge Cases

- Mentions split across editor text nodes are reconstructed into mention tokens.
- Reconstruction runs in repeated passes until stable (max 20 passes).
- Incomplete or malformed mention text stays plain text until corrected.
- `Enter` does not submit while mention menus are open; it confirms the
  selected suggestion first.
- On mobile web and app edit surfaces, `Enter` is consumed and does not submit.
- Blank-line placeholders are ignored in change detection, so placeholder-only
  differences do not trigger a save.
- For storm drops, only the currently active part content is updated.

## Failure and Recovery

- If mention reconstruction fails on a segment, the editor stays usable.
- Save failures show `Failed to update drop. Please try again.`
- If the backend rejects editing after the time window, users see `This drop can
  no longer be edited. Drops can only be edited within 5 minutes of creation.`
- If a mention renders as plain text after save, reopen `Edit Message` and
  reinsert it using autocomplete.

## Limitations / Notes

- This behavior applies to editing existing drops, not the new-drop composer.
- Mention preservation applies to recognized user and wave mentions loaded into
  edit mode.
- Edit requests keep existing drop metadata and referenced NFTs unchanged.
- Edit mode does not provide NFT hashtag autocomplete for newly typed `$[...]`
  values.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Mentions](feature-wave-mentions.md)
- [Wave NFT Hashtag References](feature-nft-hashtag-references.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
