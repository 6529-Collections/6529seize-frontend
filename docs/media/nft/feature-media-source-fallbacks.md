# NFT Media Source Fallbacks

## Overview

- Supported media surfaces auto-try backup URLs when the current image or video
  URL fails.
- Fallback order depends on renderer mode: thumbnail, default image, original
  image, default video, original video, or ReMeme-specific media.
- No sign-in or wallet connection is required.
- Fallback state is local to each rendered card/panel and resets on remount.

## Location in the Site

- `/the-memes` list cards
- `/the-memes/{id}` artwork on `Live`, `Your Cards`, and `Collectors`
- `/the-memes/{id}` artwork on `The Art`
- `/the-memes/{id}` `Live` reference grids (`Meme Lab` and `ReMemes`)
- `/meme-lab` list cards
- `/meme-lab/collection/{collection}` list cards
- `/meme-lab/{id}` artwork on `Live` and `Your Cards`
- `/meme-lab/{id}` artwork on `The Art`
- `/meme-lab/{id}` `Live` The Memes references grid
- `/rememes` list cards
- `/rememes/{contract}/{id}` artwork on `Live`
- `/rememes/{contract}/{id}` `References` The Memes grid cards
- `/6529-gradient` list cards
- `/6529-gradient/{id}` detail artwork
- `/` home `Latest Drop` artwork when the home panel is in `Now Minting` mode
- `/the-memes/mint` artwork panel

## Entry Points

- Open any supported route above.
- On tabbed card routes, switch with `focus=live`, `focus=your-cards`,
  `focus=collectors`, or `focus=the-art` where available.
- On `/`, this behavior runs only when `Latest Drop` (`Now Minting`) is shown.
  If `Next Drop` is shown, a different media renderer is used.

## Fallback Order

### Standard NFT image surfaces (`NFTImageRenderer`)

- Thumbnail mode (`showThumbnail=true`, list/grid cards):
  `thumbnail -> scaled (if present) -> image -> metadata.image`.
- Default image mode (`showThumbnail=false`, `showOriginal=false`):
  `scaled (if present) -> image -> metadata.image`.
- Original image mode (`showOriginal=true`, used on `The Art`):
  `image -> metadata.image`.

### Standard NFT video surfaces (`NFTVideoRenderer`)

- Default video mode (`showOriginal=false`):
  `compressed_animation (if present) -> animation -> metadata.animation`.
- Original video mode (`showOriginal=true`, used on `The Art`):
  `animation -> metadata.animation`.

### ReMeme image surfaces (`RememeImage`)

- Height `300`:
  `s3_image_thumbnail (if present) -> s3_image_scaled (if present) -> s3_image_original (if present) -> image (cf-ipfs gateway) -> image (ipfs.io form) -> metadata.image (cf-ipfs gateway, if present) -> metadata.image (ipfs.io form, if present) -> OpenSea collection image`.
- Height `650`:
  same order without `s3_image_thumbnail`.
- If the ReMeme `image` is a `data:` URL, S3 fallbacks still run, but
  IPFS/OpenSea URL fallbacks are skipped.

### ReMeme video surfaces (`RememeImage`)

- Video mode is used when the renderer is in animation mode with MP4 metadata,
  or when `image` ends with `.mp4`.
- If `image` ends with `.mp4`, fallback order is:
  `image (ipfs.io form) -> image (cf-ipfs gateway) -> metadata.animation (ipfs.io form, if present) -> metadata.animation (cf-ipfs gateway, if present)`.
- If video mode comes from MP4 metadata but `image` is not `.mp4`, fallback
  order is:
  `metadata.animation (ipfs.io form, if present) -> metadata.animation (cf-ipfs gateway, if present)`.

## Loading Behavior

- Standard NFT image renderer uses lazy loading only for thumbnail/`300`-height
  surfaces; larger surfaces are eager with high fetch priority.
- ReMeme image renderer is eager on both `300` and `650` surfaces.
- Standard NFT video renderer preloads media (`preload="auto"`).
- ReMeme video renderer does not set a specific preload mode.

## Failure and Recovery

- If all candidates fail, the surface stays broken/unplayable.
- There is no per-media retry button on these renderers.
- Reloading the route or re-opening the page starts the fallback order again.

## Limitations / Notes

- Source order is fixed and not user-configurable.
- Fallback only swaps URLs; it does not guarantee decode success for corrupted
  assets.
- HTML and GLB animation formats use dedicated iframe/model renderers and do
  not run this image/video fallback chain.
- Metadata fallback works only when the metadata field exists and has a usable
  URL.

## Related Pages

- [Media Index](../README.md)
- [Media NFT Index](README.md)
- [NFT Balance Indicators](feature-balance-indicators.md)
- [The Memes Card Tabs and Focus Links](../memes/feature-card-tabs-and-focus-links.md)
- [Meme Lab Card Route Tabs and Navigation](../collections/feature-meme-lab-card-route-tabs-and-navigation.md)
- [6529 Gradient List Sorting and Loading](../rendering/feature-6529-gradient-list-sorting-and-loading.md)
- [Now Minting Countdown](../memes/feature-now-minting-countdown.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
- [Docs Home](../../README.md)
