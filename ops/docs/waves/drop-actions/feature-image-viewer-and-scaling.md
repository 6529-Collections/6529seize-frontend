# Wave Drop Image Viewer and Scaling

Parent: [Wave Drop Actions Index](README.md)

## Overview

Drop attachments and markdown images render inline in wave and DM threads.
Clicking or tapping an image opens a modal viewer with zoom and quick actions.
Attachment images use larger scaling in single-drop views than in thread cards.
The viewer opens an optimized preview. For GIFs, the **HD** icon in the popup's
top-right toolbar offers **View original**. Selecting it loads the original in
the same viewer and highlights HD. The optimized image stays visible with a
small loader until the original is ready; **View optimized** switches back or
cancels a pending switch. Moving to another image resets this choice. Thread images have no HD control or GIF badge. In the Memes submission artwork
view, the HD control is always visible for both still images and GIFs, including
on touch devices. The initial artwork and popup share the selected quality.
On desktop, GIF artwork in the single-submission view tries animated previews
first. If those previews are unavailable, the original animation loads
automatically; no HD click is needed. Mobile browsers, tablets, and the native
mobile app keep bounded previews and require HD to load the original. The
improved artwork loading indicator is shared across all platforms.
HD highlights when the original is selected. Choose
**View optimized** to return to the preview or cancel the original load.

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
2. The image renders inline with a loading placeholder. GIF attachments and
   embedded GIF links show a left-aligned pulsing placeholder, capped at 16rem
   wide and tall and constrained to the available space, while their preview loads. It
   disappears when the preview is ready; failed previews use the existing
   retry or unavailable state. Reduced-motion settings disable the pulse. The placeholder uses a fallback size, not the GIF’s actual dimensions.
   GIF artwork in submission, leaderboard, participation, and winner cards instead
   shows a subtle backdrop filling the reserved media frame with a centered spinner.
   In the single-submission view on every platform, this same indicator stays
   visible while an original loads until the animation is ready, without a separate
   “Loading original GIF” stage. An available fallback preview stays behind it.
   Reduced-motion settings disable the spin; HD remains available during loading.
   These frames are reserved viewing space, not the GIF's measured dimensions.
   Card previews keep their existing GIF processing limits and do not load the
   original animation automatically.
3. Click or tap the image to open the modal viewer.
4. Zoom the image and use modal controls:
   - `Open in Browser` opens the source URL in a new tab.
   - `Download` saves the source image.
   - `HD` switches GIFs between original and optimized versions inside the popup.
     In the Memes submission artwork view, it also supports still images and is
     available before opening the popup. HD is the leftmost action in both
     toolbars, before fullscreen, open-original, and download.
   - `Full screen` enters browser fullscreen when supported and not in native app.
   - `Reset zoom` appears after zooming in.
   - `Close` exits the modal.
5. Close with the close button, backdrop click, or `Escape`.

## Common Scenarios

- Thread attachment images request `AUTOx450` scaled URLs.
- Single-drop attachment views request `AUTOx1080` scaled URLs.
- The Memes submission artwork view and its popup use responsive, quality-100
  previews generated directly from uploaded first-party still artwork. The browser
  selects a suitable resolution for its display density; GIFs keep their animated
  CDN previews. If the high-quality preview request fails, existing scaled previews are
  tried. Feeds, DMs, and supplemental images keep their existing scaling.
- Submission descriptions preserve authored line breaks, blank lines, and spaces.
  They remain plain text rather than Markdown.
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
  External HTTPS images use the site's guarded image-preview service, which
  accepts JPEG, PNG, GIF, and WebP sources; SVG images show
  `Preview unavailable`. Ordinary GIFs remain animated when processing limits
  allow; legacy and external over-budget previews may be stills. Original-file
  actions retain the source.
- Fullscreen is requested on the current rendered image element, which can differ
  between attachment and markdown rendering paths.

## Failure and Recovery

- If a larger preview fails, the viewer tries the smaller `AUTOx450` preview.
  Feeds and the viewer never automatically display the full-size original as a
  fallback. The submission artwork optimizer reads the source on the server to
  generate its responsive preview. Next may pass through source bytes for
  animations in other raster formats or when it cannot re-encode a valid image.
- If no supported preview is available, the image frame stays in place and shows
  `Preview unavailable`. Thread images retry briefly while new uploads process,
  then offer `Retry`; the viewer offers `Retry preview`.
- `Open in browser` / `Open in new tab` and `Download media` deliberately access
  the original. In the native app, downloads go directly to a temporary native
  file and the share sheet, without loading the file into the image viewer.
- GIF previews use a versioned animation-preserving resize path. The worker can
  reduce preview resolution to retain every frame within its output budget.
  GIFs that exceed processing limits fall back to a legacy preview, which may
  be static. In the desktop single-submission artwork view and its popup, unavailable
  animated previews automatically load the original GIF. An available legacy
  preview stays visible until the original is ready. This can use more
  bandwidth and device memory. Choosing **View optimized** prevents another
  automatic switch for that artwork. Mobile browsers, tablets, native mobile apps,
  feeds, grids, thread images, and supplemental
  images keep their optimized previews; choose **View original** with the popup
  toolbar's HD icon to load their original GIF deliberately.
- If loading the original fails, the viewer restores its preview, announces the
  failure, and lets you try again. The HD button shows a warning icon and its
  tooltip explains the failure. Selecting it retries and restores the HD icon;
  no playback controls or messages cover the artwork.
  An automatic desktop submission GIF load is attempted once per artwork view; a failure
  does not repeatedly reload the original when the popup is opened.
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
