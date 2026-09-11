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

Open an individual artwork and select the share icon labeled `Share artwork`
in its media controls. Meme and Gradient place it with the controls over the
artwork; NextGen places it in the control strip below the artwork. It opens
the artwork-sharing dialog on desktop, mobile web, and the native app.
The sidebar or header page-share control remains available separately; see
[Page Sharing and Device Connection](../../navigation/feature-share-modal.md).

## User Journey

1. Select the `Share artwork` icon in the artwork's media controls.
2. Review the image preview. It sits beside the controls on desktop and above
   them on mobile. Use the `Image format` menu to choose a layout:

   | Format                 | Image size  |
   | ---------------------- | ----------- |
   | `Feed · 4:5` (default) | 1080 × 1350 |
   | `Square · 1:1`         | 1080 × 1080 |
   | `Story · 9:16`         | 1080 × 1920 |
   | `Landscape · 1.91:1`   | 1200 × 630  |

3. Wait for the preview to finish preparing, then use the primary image action.
   On the web, it is `Share image` when file sharing is supported, with a
   supporting `Download image` link. Otherwise, it is `Download image`.
   In the native app, `Save or share image` opens the system share sheet.
4. Select `Copy` beside `Caption and link` to copy the artwork title, available
   artist credit, collection, and URL. The caption starts collapsed; select
   `Caption and link` to inspect or copy its full text manually.
5. For a link post, use the `Share a link` section: choose `X`, `Facebook`, or
   `Farcaster`, or select the copy icon beside the artwork URL. `More apps`
   opens the system share sheet for the link when available.
6. Review and finish the post in the destination service, signing in or pasting
   your caption when needed. Close the artwork dialog with its close button or
   `Escape`.

## Common Scenarios

- Instagram feed or Story: use `Copy` beside `Caption and link`, choose a feed
  or Story format, then save or share the image. In Instagram, select the image
  if needed and paste the caption before publishing.
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
- If copying fails, the exact text is selected for manual copying. A collapsed
  caption opens automatically; copy the selected caption or artwork URL manually.
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
