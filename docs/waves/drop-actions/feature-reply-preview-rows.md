# Wave Drop Reply Preview Rows

## Overview

Reply rows in wave timelines use a compact, fixed-height presentation so grouped
replies remain visually stable while content resolves.
Rows can switch to media-preview mode when the reply body is exactly one standalone
URL, but stay in text mode when any extra text or punctuation is present.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop-card reply preview rows in shared timeline and single-drop contexts.

## Entry Points

- Open a thread with replies under a parent drop.
- Open reply-heavy conversations with consecutive replies to the same parent.
- Open a thread where reply body contains exactly one media URL.

## User Journey

1. Open a thread and find replies rendered below parent context.
2. Reply rows render in constrained-height preview lines while loading.
3. If reply content is one standalone URL, row may switch to media-preview mode.
4. Activate the row to open the replied-to drop target.

## Common Scenarios

- Reply rows keep a fixed 24-pixel height while loading.
- Consecutive replies to the same parent can suppress repeated parent-preview
  headers to stay visually compact.
- URL-only image replies (`.gif`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`, and
  Tenor/Giphy GIF links) can render inline thumbnail media.
- URL-only video replies (`.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`, `.wmv`, `.flv`,
  `.mkv`) can render compact video placeholders.
- Inline URL text in reply previews remains non-linkified so tapping the row always
  opens the replied-to drop target.

## Edge Cases

- Rows switch to media mode only when reply content is exactly one URL and no
  surrounding text.
- Unsupported standalone link formats remain text previews.
- URL text shown in reply rows does not open that URL directly.

## Failure and Recovery

- If media resolution fails, rows stay in text mode and remain navigable.
- If preview content is delayed, fixed-height row layout prevents major timeline
  reflow.
- If row activation fails due to route/network issues, users remain in thread and
  can retry.

## Limitations / Notes

- Row-level navigation intentionally takes priority over inline URL tapping.
- Media conversion is intentionally scoped to reply preview rows, not full body
  rendering.

## Related Pages

- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Image Viewer and Scaling](feature-image-viewer-and-scaling.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
