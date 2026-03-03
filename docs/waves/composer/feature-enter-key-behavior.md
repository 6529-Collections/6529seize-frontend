# Wave Drop Composer Enter-Key Behavior

## Overview

The wave drop composer uses keyboard shortcuts to switch between submit and
newline behavior.

On desktop web:
- `Enter` submits when the draft is submittable.
- `Shift+Enter` inserts a newline.
- Repeated `Shift+Enter` keeps intentional blank spacing in rendered markdown.

In storm composition:
- If the storm already has parts and the active draft has content, `Enter`
  finalizes the current part and keeps the composer open.
- If the storm already has parts and the active draft is empty, `Enter` submits
  the full storm.

On compact layouts, action controls are collapsed behind a chevron until expanded.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}` (canonical DM route; no
  `/messages/{waveId}` route)
- Drop/post composer input in the thread footer
- Wave creation description-step editor behavior is documented separately in
  [Wave Creation Description Step](../create/feature-description-step.md)

## Entry Points

- Focus the composer input in any wave or DM thread.
- Type draft content and use keyboard submission.
- On compact layouts, open the action chevron for metadata, media, GIF, and
  storm controls.

## User Journey

1. Focus the composer and type text.
2. Press `Shift+Enter` to insert new lines.
3. Continue editing multi-line content as needed.
4. Press `Enter` to submit when the draft is valid and submittable.
5. In storm mode, if prior parts exist and the active draft has content, press
   `Enter` to finalize the current part and keep composing.
6. In storm mode, if prior parts exist and the active draft is empty, press
   `Enter` to submit the full storm.
7. On compact layouts, expand action controls before adding metadata, media, or
   GIF content.
8. On compact layouts, expanded actions collapse after the next text edit or
   when focus leaves the composer row.

## Common Scenarios

- Quick single-line drops can be posted with `Enter`.
- Multi-line drops can be written with repeated `Shift+Enter`.
- Multi-line drops can keep intentional extra blank spacing after publish.
- When composing inside a heading, `Shift+Enter` continues in a normal paragraph
  instead of keeping heading formatting.
- When autocomplete is open for mentions, hashtags, or wave mentions, `Enter`
  confirms the highlighted suggestion instead of submitting.
- In compact layouts, action controls start collapsed and open from a chevron.
- In wide layouts, action controls stay visible.

## Edge Cases

- Inside list items, `Enter` follows list editing behavior instead of forcing a
  submit.
- If required metadata or required media is missing, pressing `Enter` does not
  submit the drop.
- If the draft has no submit-ready content, `Enter` does not post.
- On mobile web or Capacitor clients, composer keyboard submit shortcuts are not
  used.
- If storm-part requirements are still missing, `Enter` does not finalize or
  submit.
- If action controls are expanded, they collapse after the next edit interaction
  or when focus leaves the composer row.
- After switching to a different wave, action controls reset to compact mode.

## Failure and Recovery

- If submit is blocked by requirements, complete missing metadata or required
  media, then press `Enter` again or use the submit button.
- If action controls are no longer visible, tap the action chevron again to reveal
  them.
- If authentication/signature is canceled, the draft remains in place so users
  can retry.
- If upload or submission fails, the composer surfaces an error and users can
  retry without rebuilding the draft from scratch.

## Limitations / Notes

- Keyboard submit behavior is desktop-focused and depends on submittable state.
- Autocomplete menus take priority over submit shortcuts while open.
- `Shift+Enter` creates paragraph breaks, not soft line-break formatting inside
  the same paragraph node.
- Intentional extra blank spacing follows markdown rendering in wave drop cards.
- Action-row behavior is layout-driven: compact rows are collapsed by default and
  expand only after explicit action interaction.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
