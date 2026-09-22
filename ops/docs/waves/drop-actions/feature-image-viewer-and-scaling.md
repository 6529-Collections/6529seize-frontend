# Wave Drop Image Viewer and Scaling

Parent: [Wave Drop Actions Index](README.md)

## Overview

Drop attachments and markdown images render inline in wave and DM threads.
Clicking or tapping an image opens a modal viewer with zoom and quick actions.
Attachment images use larger scaling in single-drop views than in thread cards.
The viewer also uses a scaled preview; opening it does not load the original.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
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
   - `Download` saves the source image.
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
- `Open in Browser` and `Download` stay available even when fullscreen is
  hidden.
- Scaled URL rewriting applies to supported hosted raster image URLs
  (`gif`, `webp`, `jpg`, `jpeg`, `png`, `avif` under supported media prefixes).
  External HTTPS images use the site's guarded image-preview service. Ordinary
  GIFs remain animated; over-budget animations use a still. Original-file actions
  retain the source.
- Fullscreen is requested on the current rendered image element, which can differ
  between attachment and markdown rendering paths.

## Failure and Recovery

- If a larger preview fails, the viewer tries the smaller `AUTOx450` preview.
  Feeds and the viewer never automatically load the original as a fallback.
- If no supported preview is available, the image frame stays in place and shows
  `Preview unavailable`. Thread images retry briefly while new uploads process,
  then offer `Retry`; the viewer offers `Retry preview`.
- `Open in browser` / `Open in new tab` and `Download media` deliberately access
  the original. In the native app, downloads go directly to a temporary native
  file and the share sheet, without loading the file into the image viewer.
- Large GIFs may have a still preview when the full animation exceeds the
  resizer's memory budget. The original animation remains available through the
  original-file actions.
- If a fullscreen request is denied or interrupted, the modal stays open and
  the other image actions continue to work.
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
- [Browser Zoom and Pinch Scaling](../../shared/feature-browser-zoom-and-pinch-scaling.md)
