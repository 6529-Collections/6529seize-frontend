# Wave Drop Reply Preview Rows

Parent: [Wave Drop Actions Index](README.md)

## Overview

When a drop replies to another drop, chat and standard winner cards can render a
compact preview row above the body.

The row stays fixed at `24px` and keeps a single-line preview.
URLs in this row are intentionally not linkified, so selecting the preview jumps
to the replied drop instead of opening that URL.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Thread cards: chat drops and standard winner drops.

## Entry Points

- Open a wave or DM thread with drops that include `reply_to`.
- Open a thread with grouped replies to the same parent drop.
- Open a thread in single-drop mode (`?drop={dropId}`).

## User Journey

1. Open a thread and find a drop that replies to another drop.
2. A compact row appears above the drop body with avatar, handle, and preview.
3. If referenced drop data is not loaded yet, the row shows `Loading...`.
4. Select the preview body to jump to the replied drop serial.
5. Select the handle to open that profile.

## Common Scenarios

- The row keeps `24px` height in loading, loaded, and not-found states.
- In grouped chat replies, repeated headers to the same parent are hidden after
  the first visible row.
- If preview text is exactly one standalone image URL, preview switches to a
  thumbnail (`.gif`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, plus
  `media.tenor.com` and `*.giphy.com` GIF hosts).
- If preview text is exactly one standalone video URL, preview switches to a
  compact video pill (`.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.wmv`, `.flv`,
  `.mkv`).
- If the reply part already has API media, preview reuses those media
  thumbnails.

## Edge Cases

- Standalone media conversion runs only when preview content is exactly one text
  segment and no existing API media is present.
- Extra text or punctuation around a URL keeps the preview in plain text mode.
- Unsupported standalone links (for example, non-media URLs) remain text.
- If the current single-drop target matches the reply target (`drop={dropId}`),
  the reply preview row is hidden for that card.
- Participatory drop cards and memes winner cards do not render this reply row.

## Failure and Recovery

- If referenced drop fetch is pending, the row shows `Loading...`.
- If referenced drop cannot be resolved, the row shows `Drop not found`.
- If jump target is outside the loaded range, serial-jump logic fetches target
  history and retries the scroll.

## Limitations / Notes

- Preview URLs are intentionally non-clickable in this row.
- The row is excluded from custom selection mode.
- This page covers reply-row behavior only.
- Full drop body rendering is owned by
  [Wave Drop Content Display](feature-content-display.md).
- Serial jump ownership is in
  [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md).

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Chat Serial Jump Navigation](../chat/feature-serial-jump-navigation.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
