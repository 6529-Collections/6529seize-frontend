# Wave Drop Composer Enter-Key Behavior

## Overview

The thread composer uses `Enter` for submit and `Shift+Enter` for line breaks.

- Desktop web: `Enter` submits when submit is allowed.
- Desktop web: `Shift+Enter` inserts a new paragraph.
- Storm mode: when prior parts exist, `Enter` with current draft content adds
  that part; `Enter` on an empty draft submits the storm.
- Narrow composer rows show metadata/media/GIF/storm actions behind a chevron.
  After opening, those actions collapse on the next edit or when focus leaves
  the composer row.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; no
  `/messages/{waveId}` route)
- Drop/post composer input in the thread footer

## Entry Points

- Focus the composer in a wave or DM thread.
- Type content and press `Enter` or `Shift+Enter`.
- On narrow rows, open the chevron to reveal composer actions.

## User Journey

1. Open a wave or DM thread composer.
2. Type content.
3. Use `Shift+Enter` for extra lines.
4. Press `Enter` to submit when the draft is submittable.
5. In storm mode with existing parts:
   press `Enter` with content to add a part, or press `Enter` on empty content
   to submit the storm.
6. On narrow rows, use the chevron to show actions, then continue typing.

## Common Scenarios

- Send a short draft quickly with `Enter`.
- Write multi-line content with repeated `Shift+Enter`.
- Select mention/hashtag/wave suggestions with `Enter` while typeahead is open.
- Keep adding storm parts with `Enter` until ready to submit.

## Edge Cases

- Inside list items, `Enter` keeps list editing behavior.
- In headings, `Shift+Enter` continues in a paragraph instead of extending the
  heading.
- In `Drop` mode, missing required metadata or media blocks `Enter`
  submission.
- If there is no submit-ready content, `Enter` does not submit.
- Mobile web and Capacitor disable Enter-key submit shortcuts.
- On narrow rows, expanded actions collapse after the next edit, on blur, and
  when switching waves.

## Failure and Recovery

- If submit is blocked in `Drop` mode, complete required metadata/media and
  retry `Enter` or use the submit button.
- If actions collapse on a narrow row, open them again with the chevron.
- If auth/signature is canceled, the draft stays in place.
- If upload or submit fails, the composer shows an error and keeps the draft for
  retry.

## Limitations / Notes

- Enter-key submission is desktop-focused and still depends on submit-ready
  state.
- Open typeahead menus take precedence over submit shortcuts.
- `Shift+Enter` inserts paragraphs.
- Wide rows keep composer actions visible without the chevron.
- Wave creation `Description` uses a different editor flow in
  [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Body Length Limits and Storm Rules](feature-wave-drop-body-length-limits.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
