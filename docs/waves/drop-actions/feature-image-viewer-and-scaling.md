# Wave Drop Image Viewer and Scaling

Parent: [Wave Drop Actions Index](README.md)

## Overview

Drop attachments and markdown images render inline in wave and DM threads.
Clicking or tapping an image opens a modal viewer with zoom and quick actions.
Attachment images use larger scaling in single-drop views than in thread cards.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop overlay in the same route context via `?drop={dropId}`
- Image attachments and markdown-embedded images in drop bodies

## Entry Points

- Open a wave or DM thread with image media in a drop.
- Click or tap an attachment image or markdown image in drop content.
- Open a single-drop overlay from `Open drop` action or a `?drop=` URL.

## User Journey

1. Open a thread and find a drop that contains image media.
2. The image renders inline with a loading placeholder.
3. Click or tap the image to open the modal viewer.
4. Zoom the image and use modal controls:
   - `Open in Browser` opens the source URL in a new tab.
   - `Full screen` enters browser fullscreen when supported and not in native app.
   - `Reset zoom` appears after zooming in.
   - `Close` exits the modal.
5. Close with the close button, backdrop click, or `Escape`.

## Common Scenarios

- Thread attachment images request `AUTOx450` scaled URLs.
- Single-drop attachment views request `AUTOx1080` scaled URLs.
- Markdown image embeds use the same modal controls but keep `AUTOx450` scaling,
  including inside single-drop views.
- Touch devices show a static loading placeholder for attachment images.
- Non-touch devices show an animated pulse placeholder for attachment images.
- Competition-style artwork panels center image content in the frame.

## Edge Cases

- Fullscreen control is hidden in native app sessions and when browser fullscreen
  APIs are unavailable.
- `Open in Browser` stays available even when fullscreen is hidden.
- Scaled URL rewriting applies only to supported hosted raster image URLs
  (`gif`, `webp`, `jpg`, `jpeg`, `png` under supported media prefixes).
- Fullscreen is requested on the current rendered image element, which can differ
  between attachment and markdown rendering paths.

## Failure and Recovery

- If a scaled attachment URL fails, the viewer falls back to the original media URL.
- If image loading still fails, users see `Couldn’t load image.` and can press
  `Retry`.
- If fullscreen is unavailable, users can still open the source in a new tab.
- If media is slow to load, card layout stays stable behind placeholder UI.

## Limitations / Notes

- This viewer behavior is for image media. Other media types use their own
  players.
- Larger detail-scale behavior applies to attachment media in single-drop/detail
  contexts, not every image render path.
- Browser/page zoom behavior is documented separately.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Media Download](feature-media-download.md)
- [Browser Zoom and Pinch Scaling](../../shared/feature-browser-zoom-and-pinch-scaling.md)
