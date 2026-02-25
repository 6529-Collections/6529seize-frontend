# Wave Drop Markdown Blank-Line Preservation

## Overview

Wave drop markdown preserves intentional extra blank lines across compose, edit,
and display flows. When users add multiple empty lines, published drops keep
that spacing instead of collapsing everything to a single paragraph break.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- DM wave threads: `/messages?wave={waveId}`
- Existing drop edit modal opened from a drop action menu
- Wave creation flow description editor: `/waves/create`
- Wave-style drop card rendering surfaces that reuse the shared markdown
  renderer

## Entry Points

- Press `Shift+Enter` repeatedly in a wave drop composer.
- Open `Edit Message` on a drop that already includes extra blank lines.
- Paste multi-paragraph markdown that includes intentional blank spacing.

## User Journey

1. Open a wave or DM composer (or the `/waves/create` description editor).
2. Write markdown and insert extra empty lines with repeated `Shift+Enter`.
3. Submit the drop.
4. Read the posted drop and verify the extra spacing is still visible.
5. Re-open the drop in edit mode, keep or adjust spacing, then save.

## Common Scenarios

- Writers separate sections with extra vertical space for readability.
- Multi-paragraph drops keep visible spacing between sections after publishing.
- Existing drops with blank-line spacing can be edited without flattening
  paragraph spacing.
- Markdown copied from Windows-style line endings keeps expected line breaks.

## Edge Cases

- Runs of three or more newline characters render with visible empty
  paragraphs instead of collapsing to one break.
- Edit mode keeps intentional blank rows visible while typing in the lexical
  editor.
- Saving compares normalized markdown content, so hidden editor placeholders do
  not count as user-visible text changes.

## Failure and Recovery

- If a user saves without any real markdown change, edit mode closes without
  submitting a redundant update.
- If drop submission fails, the composed draft remains available so users can
  retry.
- If a render surface fails to load the drop list, reopening or refreshing the
  thread reloads content with preserved spacing.

## Limitations / Notes

- A single blank line still behaves as standard markdown paragraph separation.
- This page describes wave-related markdown composers, editors, and drop-card
  rendering surfaces.
- Other text inputs elsewhere in the site may use different spacing rules.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Docs Home](../../README.md)
