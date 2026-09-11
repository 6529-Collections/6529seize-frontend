# Artwork Sharing

Parent: [Media NFT Index](README.md)

## Overview

`Share artwork` helps you share an individual Meme Card, 6529 Gradient, or
NextGen token. Send its link, copy a caption, or prepare a still image with the
artwork title and available artist credit for a feed or Story.

## Location in the Site

- The Memes: `/the-memes/{id}`
- 6529 Gradient: `/6529-gradient/{id}`
- NextGen: `/nextgen/token/{token}`

## Entry Points

Open an individual artwork and select `Share artwork` beside its art. This
opens the artwork-sharing dialog on desktop, mobile web, and the native app.
The sidebar or header page-share control remains available separately; see
[Page Sharing and Device Connection](../../navigation/feature-share-modal.md).

## User Journey

1. Select `Share artwork`.
2. For a link post, select `Share on X`, `Facebook`, or `Farcaster`. Complete
   sign-in and review the post in the destination service before publishing.
3. Use `Copy link` for the artwork URL or `Copy caption` for the artwork title,
   available artist credit, collection, and URL. `Caption and link` also lets
   you select and copy the text manually.
4. For an image post, choose an `Image format` and wait for its preview:

   | Format                 | Image size  |
   | ---------------------- | ----------- |
   | `Feed · 4:5` (default) | 1080 × 1350 |
   | `Square · 1:1`         | 1080 × 1080 |
   | `Story · 9:16`         | 1080 × 1920 |
   | `Link card · 1.91:1`   | 1200 × 630  |

5. On the web, select `Download image`, or `Share image` when your browser
   supports sharing the prepared file. In the native app, select
   `Save or share image` to open the system share sheet.
6. Choose an available destination, add or paste your caption, and review the
   result there. Close the artwork dialog with its close button or `Escape`.

## Common Scenarios

- Instagram feed or Story: copy the caption, choose a feed or Story format,
  then save or share the image. In Instagram, select the image if needed and
  paste the caption before publishing.
- X or Facebook link post: use the named link action. The destination controls
  its link preview; the prepared image is not attached by the link action.
- Image post on X, Facebook, or another service: download or share the prepared
  image and add the copied caption in that service.
- Another app: use `More apps` to share the artwork link through the system
  share sheet when available. Use `Share image` or `Save or share image` for
  the file itself.

## Edge Cases

- Artwork-sharing links open the main artwork page on `6529.io`, without the
  current tab, filters, or profile-return context.
- Exports are PNG still images. Animated or interactive artwork uses its
  available static image; exports do not record animation or live interactions.
- Artwork keeps its proportions within the selected layout. The export adds
  artwork information rather than cropping the original to fill the format.
- Artist credit appears when the artwork has artist information. Long text can
  be shortened in the image; the copyable caption retains the supplied text.
- Changing formats prepares a new preview. Image actions become available
  when that format is ready; link and caption actions can be used immediately.

## Failure and Recovery

- If image preparation fails, select `Try again`, choose another format, or
  continue with the link and caption actions.
- If copying fails, select and copy the text in `Caption and link` manually.
- If browser image sharing fails or is unavailable, use `Download image` and
  upload the saved image in the destination app.
- If native image sharing fails, the dialog shows an error; try the image
  action again. If link sharing fails, copy the link or caption instead.
- Canceling a system share sheet does not publish anything or show an error.

## Limitations / Notes

- Available share-sheet destinations depend on the device and installed apps.
  Instagram may not appear, and a destination may require you to paste the
  caption separately.
- Opening a composer or share sheet does not publish a post. You finish the
  post in the destination service; 6529 does not automatically post for you.
- A successful file handoff does not confirm that the destination published it.
- The artwork viewer's original-media downloads remain separate from these
  formatted still-image exports.

## Related Pages

- [Media NFT Index](README.md)
- [The Memes Card Tabs and Focus Links](../memes/feature-card-tabs-and-focus-links.md)
- [NextGen Token Media Rendering](../../nextgen/feature-token-media-rendering.md)
- [Page Sharing and Device Connection](../../navigation/feature-share-modal.md)
