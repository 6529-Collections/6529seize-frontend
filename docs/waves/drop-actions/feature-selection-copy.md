# Wave Drop Selection Copy

Parent: [Waves Index](../README.md)

## Overview

Wave and direct-message drop threads support text-selection copy directly from
the timeline. Standard copy (`Cmd/Ctrl+C`) produces plain text. Keyboard copy
with `Shift` (`Cmd/Ctrl+Shift+C`) produces markdown-oriented output.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop timeline cards rendered in the thread feed

## Entry Points

- Drag-select text inside one or more visible drop cards, then press
  `Cmd/Ctrl+C`.
- On keyboard-capable devices, drag-select text and press
  `Cmd/Ctrl+Shift+C` for markdown-formatted copy.

## User Journey

1. Open a wave or direct-message thread.
2. Select text from one drop or across multiple drops in the feed.
3. Copy with `Cmd/Ctrl+C` (plain text) or `Cmd/Ctrl+Shift+C` (markdown).
4. Paste into another app.
5. Continue reading the feed without opening single-drop details.

## Common Scenarios

- Copying part of one drop pastes only the selected text snippet.
- Copying a full drop includes author/time context and drop content.
- Copying across multiple full drops produces multiple message blocks in feed
  order.
- Copy output can include quoted/replied context, metadata summaries, and media
  attachment URLs when those are part of selected full drops.
- Markdown copy preserves markdown-style structure (for example quote blocks
  and markdown links) for paste targets that support markdown.
- Selecting text suppresses click-through navigation so users can copy without
  accidentally opening drop details.

## Edge Cases

- If a selection starts or ends mid-drop, boundary drops are copied as selected
  text while fully selected drops in the middle use structured message blocks.
- Winner-type drops can include rank summary lines in structured copy output.
- Attachment URLs are de-duplicated per copied drop before paste output is
  generated.
- Copying from inputs or other editable fields keeps normal browser copy
  behavior.
- Context-menu copy does not provide the markdown shortcut variant because that
  variant is keyboard-shortcut based.

## Failure and Recovery

- If clipboard write permissions are restricted by the browser, copy output can
  fail silently; retrying with standard browser copy gestures is still
  available.
- If no valid non-collapsed selection exists in the drop feed, normal browser
  copy behavior continues.
- If selected content cannot be resolved to loaded drop cards, the thread
  remains usable and users can reselect visible content and retry.

## Limitations / Notes

- This behavior applies to drop timeline selection copy, not the `Copy link`
  action in drop menus.
- Markdown-variant copy requires keyboard shortcuts and is not available via
  all mobile/touch copy surfaces.
- Structured message formatting applies to selected full-drop blocks; partial
  boundary selections remain plain selected text snippets.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
