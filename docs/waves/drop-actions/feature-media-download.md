# Wave Drop Media Download

Parent: [Wave Drop Actions Index](README.md)

## Overview

Use `Download media` to save a drop attachment from the desktop `More` menu.
This action is not available in the touch drop menu.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Full drop cards with desktop action controls (`More` menu)

## Entry Points

- Open a wave or direct-message thread.
- Hover a full drop card and open `More` (`...`).
- Select `Download media` when the row is available.

## What Happens

1. Open `More` on a drop with downloadable media.
2. Select `Download media`.
3. The menu closes and the browser download starts.
4. The downloaded filename is derived from the media URL path.

## Availability and Edge Cases

- The row is shown only when the first media item on the first drop part has a
  parseable filename and extension.
- If no media URL exists, or the URL has no parseable extension, the row is
  hidden.
- Only one row is exposed (`parts[0].media[0]`); additional attachments do not
  get separate download rows.
- Temporary or text-only drops usually do not show this action.
- The touch long-press/header-button menu does not include `Download media`.

## Failure and Recovery

- If the browser blocks download start, or the media URL fails, there is no
  dedicated drop-menu error state.
- Retry from `More` after fixing browser permission or network blockers.

## Notes

- This page covers thread drop-menu download behavior only.
- Other download surfaces are documented in their own feature pages.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Image Viewer and Scaling](feature-image-viewer-and-scaling.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Waves Index](../README.md)
- [Media Index](../../media/README.md)
