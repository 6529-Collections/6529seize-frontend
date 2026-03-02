# Wave Drop Markdown Blank-Line Preservation

## Overview

Wave drop markdown keeps intentional extra blank lines through compose, edit,
and rendering. Repeated `Shift+Enter` spacing stays visible after posting and
after edit-save cycles.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; no
  `/messages/{waveId}` route)
- Existing drop edit modal opened from a drop action menu
- Wave drop-card rendering surfaces that reuse the shared markdown
  renderer

## Entry Points

- Insert repeated blank lines in a thread composer with `Shift+Enter`.
- Open `Edit Message` on a drop that already has extra blank spacing.
- Paste markdown content that includes intentional blank spacing.

## User Journey

1. Open a wave or DM thread.
2. Write markdown and add extra blank lines with repeated `Shift+Enter`.
3. Submit the drop.
4. Confirm spacing is preserved in the rendered drop.
5. Re-open the drop in edit mode, keep or change spacing, then save.

## Common Scenarios

- Writers separate sections with extra vertical space for readability.
- Multi-paragraph drops keep visible spacing between sections after publishing.
- Existing drops with blank-line spacing can be edited without flattening
  paragraph spacing.
- Markdown copied with Windows-style line endings keeps expected line breaks.

## Edge Cases

- Runs of three or more newline characters keep visible blank spacing instead
  of collapsing to a single break.
- Edit mode keeps intentional blank rows visible while typing.
- Save comparisons use normalized markdown content, so hidden blank-line
  placeholders do not count as user-visible text changes.

## Failure and Recovery

- If a user saves without user-visible markdown changes, edit mode closes
  without submitting a redundant update.
- If drop submission fails, the composed draft remains available so users can
  retry.

## Limitations / Notes

- A single blank line still behaves as standard markdown paragraph separation.
- This page covers wave and DM thread composer/edit behavior plus drop-card
  rendering surfaces.
- Wave creation description-step behavior is documented in
  [Wave Creation Description Step](../create/feature-description-step.md).
- Other text inputs elsewhere in the site may use different spacing rules.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
