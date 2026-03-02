# Wave Drop Markdown Blank-Line Preservation

## Overview

Wave and DM markdown drops keep intentional extra blank spacing through compose,
edit, and rendering.

Runs of empty lines created with repeated `Shift+Enter` or pasted markdown keep
visible vertical spacing after posting and after edit saves.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; no
  `/messages/{waveId}` route)
- Existing drop edit modal opened from a drop action menu (`Edit Message`,
  shown only on your own drops)
- Wave/DM drop-card rendering surfaces that reuse the shared markdown renderer

## Entry Points

- Add repeated blank lines in a thread composer with `Shift+Enter`.
- Paste markdown that already contains repeated blank lines.
- Open `Edit Message` on a drop that already has blank-line spacing.

## User Journey

1. Open a wave or DM thread.
2. Write markdown and add extra blank lines with repeated `Shift+Enter`, or
   paste markdown that already contains them.
3. Submit the drop.
4. Confirm spacing is preserved in the rendered drop.
5. Re-open the drop in edit mode, keep or change spacing, then save.
6. Confirm saved content keeps the same visible spacing rules.

## Common Scenarios

- Writers separate sections with extra vertical space for readability.
- Multi-paragraph drops keep visible spacing between sections after publishing.
- Existing drops with blank-line spacing can be edited without flattening
  spacing.
- Markdown copied with Windows-style line endings keeps expected line breaks.

## Edge Cases

- Runs of three or more newline characters keep visible blank spacing instead
  of collapsing to a single break.
- Edit mode keeps intentional blank rows visible while typing.
- Line endings are normalized (`CRLF` to `LF`) before save/change checks, so
  pasted Windows line endings keep expected visible spacing.
- Save checks ignore invisible blank-line placeholders and surrounding
  whitespace-only differences.

## Failure and Recovery

- If a user saves without user-visible markdown changes, edit mode closes
  without submitting a redundant update.
- If pre-submit checks fail (for example auth cancellation, upload failure, or
  signature cancellation), the composer keeps the draft so users can retry.
- After a drop request is queued, the composer clears immediately. If the
  backend request later fails, users must re-compose and resend.
- If an edit update request fails, the app shows an error toast. Re-open
  `Edit Message` and retry.

## Limitations / Notes

- A single blank line still behaves as standard markdown paragraph separation.
- This page covers wave and DM thread composer/edit behavior plus drop-card
  rendering surfaces.
- Wave creation description-step behavior is documented in
  [Wave Creation Description Step](../create/feature-description-step.md).
- Other text inputs elsewhere in the site may use different spacing rules.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
