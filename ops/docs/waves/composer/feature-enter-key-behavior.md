# Wave Drop Composer Enter-Key Behavior

## Overview

On desktop, the thread composer uses `Enter` for submit and `Shift+Enter` for
line breaks. Mobile web and the app use Return for a line break and the visible
Send button for submission.

- Desktop web: `Enter` submits when submit is allowed.
- After an accepted desktop chat send with `Enter`, the empty composer keeps
  focus so you can immediately type the next message.
- Desktop web: `Shift+Enter` inserts a new paragraph.
- Mobile web and the app: an accepted chat send removes input focus and dismisses
  the keyboard. Canceled authentication and refused or failed submissions keep
  the draft without deliberately dismissing the keyboard.
- Storm mode: when prior parts exist, `Enter` follows the visible primary
  action. It selects `Add part` or `Save changes` with current content and
  selects `Post storm` on an empty current editor.
- Narrow composer rows show a plus button beside the input. It opens a labeled
  action tray below the input for Upload, GIF, Poll, Storm, and Metadata when
  available. The tray collapses after an action is selected, on the next edit,
  or when focus leaves the composer row.
- On mobile and in the app, the GIF picker uses the same bottom-sheet handle and
  swipe-down dismissal as the emoji picker.
- Poll and Storm are mutually exclusive on narrow composer rows. While a Poll
  editor is open, the plus control becomes an X that closes Poll and the action
  tray stays unavailable. While a Storm draft is active, Poll remains visible
  in the action tray but is unavailable until the Storm is finished or
  discarded.

Ordinary and encrypted chat share the rich-text editor, focus treatment, input
sizing and keyboard/safe-area handling. Custom emoji render inline while composing.
Encrypted chat keeps its own encrypted sending and attachments and omits GIF,
Poll and Storm. Placeholders are **Write a message** for ordinary messages and
**Write an encrypted message** for encrypted messages on every device.

Expanded browser actions use flat icon buttons with a rounded-square hover
background and tooltips. Upload uses a paperclip. The narrow-row plus toggle
and labeled action tray retain their existing icons.

Wave chat and unencrypted DM composers use the same outlined paper-airplane send
icon as encrypted chat, on desktop and mobile. The chat send control stays square
instead of expanding to show a `Post` label on desktop. Storm actions keep their
specific Add part, Save changes and Post storm labels.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages/{waveId}` (canonical DM route; legacy query links redirect here)
- Drop/post composer input in the thread footer

## Entry Points

- Focus the composer in a wave or DM thread.
- Type content and press `Enter` or `Shift+Enter`.
- On narrow rows, select the plus button to open the labeled composer actions.

## User Journey

1. Open a wave or DM thread composer.
2. Type content.
3. On desktop, use `Shift+Enter` for extra lines; on mobile use Return.
4. On desktop, press `Enter` when the draft is submittable; on mobile use Send.
5. In storm mode with existing parts, check the primary action and press
   `Enter` to add or save current content, or to post from an empty editor.
6. On narrow rows, use the plus button to show labeled actions, then choose an
   action or continue typing.

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
- Poll cannot be layered with GIF or Storm on narrow rows. Close the active Poll
  editor before opening another composer tool, and finish or discard an active
  Storm before creating a Poll.

## Failure and Recovery

- If submit is blocked in `Drop` mode, complete required metadata/media and
  retry `Enter` or use the submit button.
- If actions collapse on a narrow row, open them again with the plus button.
- If auth/signature is canceled, the draft stays in place.
- If upload or submit fails, the composer shows an error and keeps the draft for
  retry.

## Limitations / Notes

- Enter-key submission is desktop-focused and still depends on submit-ready
  state.
- Open typeahead menus take precedence over submit shortcuts.
- With an empty chat input and no reply, edit or attachment in progress, Arrow Up
  opens the latest eligible own message for editing.
- Dismissing the native keyboard removes input focus. Bottom safe-area clearance
  is used while the keyboard is closed and removed while it is open.
- `Shift+Enter` inserts paragraphs.
- Wide rows keep composer actions visible without the expandable tray.
- Wave creation `Description` uses a different editor flow in
  [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Storm Composer](feature-storm-composer.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Body Length Limits and Storm Rules](feature-wave-drop-body-length-limits.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)

The chat send button uses a grey background and muted icon when disabled, and
a blue background with a white icon when enabled. This appearance is shared by
Waves, unencrypted DMs and encrypted DMs on browser and mobile.
