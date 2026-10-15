const NON_IMAGE_EXTENSION =
  /\.(?:mp4|mov|webm|m4v|m3u8|ogv|ogg|avi|wmv|flv|mkv|html?|glb|gltf)$/i;

// GIF previews are animated and often several megabytes (the scaled GIF of a
// video card can be larger than the video's first frame by orders of
// magnitude). A video poster should be a still, so GIFs are never used; the
// video shows its own first frame instead.
const ANIMATED_IMAGE_EXTENSION = /\.gif$/i;

/** Pick an existing still preview image without trying to decode the video. */
export function getVideoPosterSrc(
  candidates: readonly unknown[]
): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const src = candidate.trim();
    if (
      !src ||
      (/^data:/i.test(src) && !/^data:image\//i.test(src)) ||
      /^data:image\/gif/i.test(src)
    ) {
      continue;
    }

    const path = src.split(/[?#]/, 1)[0] ?? "";
    if (
      !NON_IMAGE_EXTENSION.test(path) &&
      !ANIMATED_IMAGE_EXTENSION.test(path)
    ) {
      return src;
    }
  }

  return undefined;
}
