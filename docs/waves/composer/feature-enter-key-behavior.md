# Wave Drop Composer Enter-Key Behavior

## Overview

The wave drop composer uses keyboard shortcuts for submit vs newline behavior.
On desktop web, `Enter` submits when the draft is submittable, while
`Shift+Enter` inserts a newline. Repeated `Shift+Enter` presses keep intentional
blank spacing in published markdown drops.

In storm-composition mode (multi-part submissions), `Enter` finalizes the current
draft part when prior parts already exist. That adds the current part to the draft
queue and keeps the composer open for additional parts.

## Location in the Site

- Wave detail threads: `/waves/{waveId}`
- Direct-message wave threads: `/messages?wave={waveId}`
- Drop/post composer input in the thread footer

## Entry Points

- Focus the composer input in any wave or DM wave thread.
- Type draft content in the composer.
- Use the keyboard instead of clicking the submit button.

## User Journey

1. Focus the composer and type text.
2. Press `Shift+Enter` to insert a new line in the draft.
3. Continue editing, including multi-line content when needed.
4. Press `Enter` to submit when the draft is valid and submittable.
5. If composing a multi-part storm drop and there is already at least one prior
   part, press `Enter` to finalize the current part and immediately continue with
   another part.
6. With existing storm parts and an empty composer, press `Enter` to submit the
   full storm as a complete drop.

## Common Scenarios

- Quick single-line drops can be posted with `Enter`.
- Multi-line drops can be written with repeated `Shift+Enter`.
- Multi-line drops can include extra blank spacing, and posted content keeps
  that spacing visible.
- When composing inside a heading, `Shift+Enter` continues in a normal
  paragraph instead of keeping heading formatting.
- When autocomplete is open for mentions, hashtags, or wave mentions, `Enter`
  confirms the highlighted suggestion instead of submitting immediately.
- In storm-composition flows, `Enter` adds a new part first when the active
  draft has content.
- In storm-composition flows, `Enter` with no active draft content submits all
  queued parts as the final post.

## Edge Cases

- Inside list items, `Enter` follows list editing behavior instead of forcing a
  submit.
- If required metadata or required media is missing, pressing `Enter` does not
  submit the drop.
- If the draft has no submit-ready content, `Enter` does not post.
- On mobile web or Capacitor clients, composer keyboard submit shortcuts are not
  used.
- If a required part is still being edited and cannot be finalized due missing
   requirement checks, `Enter` keeps the composer in edit mode.
- If a storm composer has existing parts but no active draft content, `Enter`
  submits the entire storm and exits composer as a single submission.

## Failure and Recovery

- If a submit attempt is blocked by requirements, complete missing metadata or
  attach required media, then press `Enter` again or use the submit button.
- If authentication/signature is canceled, the draft remains in place so users
  can retry.
- If upload or submission fails, the composer surfaces an error and users can
  retry without rebuilding the draft from scratch.

## Limitations / Notes

- Keyboard submit behavior is desktop-focused and depends on the composer being
  in a submittable state.
- Autocomplete menus take priority over submit shortcuts while open.
- `Shift+Enter` creates paragraph breaks, not soft line-break formatting inside
  the same paragraph node.
- Intentional extra blank spacing follows markdown rendering behavior used by
  wave drop cards.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
