# Wave Drop Selection Copy

Parent: [Wave Drop Actions Index](README.md)

## Overview

Wave and direct-message threads support selection copy on visible full drop
cards.

- `Cmd/Ctrl+C` copies plain-text output.
- `Cmd/Ctrl+Shift+C` copies markdown-formatted output.
- Browser/context-menu copy stays plain-text.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop mode chat panel opened with `drop={dropId}`
- Full drop cards rendered in the thread feed

## Entry Points

- Select text in one or more visible full drop cards (mouse drag or native
  touch selection handles).
- Press `Cmd/Ctrl+C` for plain-text copy.
- Press `Cmd/Ctrl+Shift+C` for markdown copy when a keyboard is available.
- Use browser/context-menu copy when you need plain-text copy without a
  keyboard shortcut.

## User Journey

1. Open a wave/DM thread or single-drop chat panel.
2. Select text from one drop or across multiple visible drops.
3. Copy with `Cmd/Ctrl+C` (plain) or `Cmd/Ctrl+Shift+C` (markdown).
4. Paste into another app.
5. Continue reading without accidental click-through while text is selected.

## Copy Output Rules

- Copying only part of one drop pastes only the selected snippet.
- Copying a fully selected drop includes author/time context plus drop content.
- Copying multiple fully selected drops creates one formatted block per drop in
  thread order (oldest to newest).
- Structured output can include reply/quote context.
- Non-chat drops can add a `Type` line. Winner drops can add a `Rank` line.
- Structured output can include metadata-derived lines and media attachment URLs.
- Attachment URLs are de-duplicated per copied drop.
- Markdown copy preserves markdown structure such as quote blocks and markdown
  links.
- Selecting text suppresses click-through navigation so users can copy without
  accidentally opening drop details.

## Edge Cases

- If selection starts or ends mid-drop, boundary drops use raw selected text
  while fully selected drops in the middle use formatted message blocks.
- Selection inside inputs or other editable fields keeps normal browser copy
  behavior.
- If selection cannot be matched to loaded full drop cards, the app does not
  override browser copy.
- Context-menu copy and touch copy surfaces do not expose the markdown shortcut
  variant.

## Failure and Recovery

- If no valid non-collapsed selection exists in the thread, normal browser copy
  behavior continues.
- If clipboard APIs are blocked or unavailable, copy can fail silently; reselect
  and retry with your browser's copy gesture.
- The thread remains usable after failed attempts, so users can reselect and
  retry immediately.

## Limitations / Notes

- This behavior applies to drop timeline selection copy, not the `Copy link`
  action in drop menus.
- Markdown copy requires the keyboard shortcut `Cmd/Ctrl+Shift+C`.
- Structured message formatting applies only to fully selected full-drop blocks;
  partial boundary selections remain raw selected text.
- Copy interception applies only to loaded full drop cards in the active thread
  container.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Reply Preview Rows](feature-reply-preview-rows.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
