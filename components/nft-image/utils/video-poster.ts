const NON_IMAGE_EXTENSION =
  /\.(?:mp4|mov|webm|m4v|m3u8|ogv|ogg|avi|wmv|flv|mkv|html?|glb|gltf)$/i;

/** Pick an existing preview image without trying to decode the video. */
export function getVideoPosterSrc(
  candidates: readonly unknown[]
): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const src = candidate.trim();
    if (!src || (/^data:/i.test(src) && !/^data:image\//i.test(src))) {
      continue;
    }

    const path = src.split(/[?#]/, 1)[0] ?? "";
    if (!NON_IMAGE_EXTENSION.test(path)) {
      return src;
    }
  }

  return undefined;
}
