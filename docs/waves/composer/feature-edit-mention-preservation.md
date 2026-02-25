# Wave Drop Edit Mention Preservation

## Overview

When users edit an existing wave drop, existing user mentions and wave mentions
stay intact in the editor instead of breaking into plain text fragments. This
helps users revise wording around mentions without losing mention behavior,
including drops that contain intentional extra blank lines.

## Location in the Site

- Wave detail threads: `/waves/{waveId}`
- Direct-message wave threads: `/messages?wave={waveId}`
- Existing drop cards where `Edit Message` is available

## Entry Points

- Open a drop action menu and choose `Edit Message`.
- Edit a previously posted drop that already contains user mentions or wave
  mentions.

## User Journey

1. Open edit mode for an existing drop.
2. The edit composer loads the current drop content and places the caret at the
   end of the message.
3. Existing mentions remain mention entities while users keep typing or editing.
4. Save the edit from keyboard (`Enter` on desktop) or the save button.
5. The updated drop renders with mentions preserved in the thread.

## Common Scenarios

- Correct a typo in a sentence that includes one or more mentions.
- Append text after a mention without needing to recreate the mention.
- Edit drops containing both user mentions and wave mentions in the same body.
- Edit mention-heavy drops that also use extra blank spacing between sections.

## Edge Cases

- Mention text that was internally split while loading is reconstructed so it
  still behaves like a mention in edit mode.
- Multiple split mention segments in the same message are reconstructed
  iteratively until the editor reaches a stable state.
- Incomplete mention text (for example, missing closing characters) stays plain
  text until users complete or rewrite it.
- Blank-line spacing remains editable and is compared as normalized markdown, so
  hidden editor placeholders do not trigger false "changed" saves.

## Failure and Recovery

- If a specific mention cannot be reconstructed automatically, the editor still
  stays usable and the rest of the message remains editable.
- Users can delete and re-enter a broken mention using mention autocomplete,
  then save again.

## Limitations / Notes

- This behavior applies to editing existing drops, not the new-drop composer.
- Auto-preservation only applies to recognized mention patterns for users and
  waves.
- Very malformed mention text may require manual correction before it behaves as
  a mention again.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
