/**
 * Animated-preview limits for uploaded GIF artwork.
 *
 * The media resizer only builds animated thumbnails for GIFs inside these
 * limits; larger GIFs fall back to a still preview in Waves and leaderboards
 * until a viewer opens the original (HD). Mirror of the resizer contract in the
 * backend `docs/gif-animation-previews.md`.
 */
export const GIF_ANIMATED_PREVIEW_MAX_FRAME_PIXELS = 8_388_608;
export const GIF_ANIMATED_PREVIEW_MAX_FRAMES = 120;
export const GIF_ANIMATED_PREVIEW_MAX_TOTAL_PIXELS = 268_435_456;

// Uploads are capped below this; never read an unbounded file into memory.
const MAX_INSPECTED_BYTES = 256 * 1024 * 1024;

const GIF_HEADER_LENGTH = 13;
const EXTENSION_INTRODUCER = 0x21;
const IMAGE_SEPARATOR = 0x2c;

export interface GifAnimationInfo {
  readonly width: number;
  readonly height: number;
  readonly frames: number;
}

export type GifAnimatedPreviewIssue =
  | { readonly kind: "framePixels"; readonly info: GifAnimationInfo }
  | { readonly kind: "frames"; readonly info: GifAnimationInfo }
  | { readonly kind: "totalPixels"; readonly info: GifAnimationInfo };

const colorTableBytes = (packed: number): number =>
  (packed & 0x80) === 0 ? 0 : 3 * 2 ** ((packed & 0x07) + 1);

/** Skips GIF data sub-blocks; returns the index after the block terminator. */
const skipSubBlocks = (bytes: Uint8Array, start: number): number | null => {
  let index = start;
  while (index < bytes.length) {
    const size = bytes[index]!;
    if (size === 0) return index + 1;
    index += size + 1;
  }
  return null;
};

type GifBlockStep =
  | { readonly next: number; readonly frame: boolean }
  | null;

/** Steps over one extension or image block; null at the trailer or bad data. */
const stepGifBlock = (bytes: Uint8Array, index: number): GifBlockStep => {
  const marker = bytes[index];
  if (marker === EXTENSION_INTRODUCER) {
    const next = skipSubBlocks(bytes, index + 2);
    return next === null ? null : { next, frame: false };
  }
  if (marker !== IMAGE_SEPARATOR) return null;
  const packedIndex = index + 9;
  if (packedIndex >= bytes.length) return null;
  // Descriptor (10 bytes), local color table, LZW minimum code size.
  const dataStart = index + 10 + colorTableBytes(bytes[packedIndex]!) + 1;
  const next = skipSubBlocks(bytes, dataStart);
  // A truncated image still counts: its descriptor was read.
  return { next: next ?? bytes.length, frame: true };
};

/**
 * Reads the logical screen size and counts image frames. Returns null for
 * anything that is not a readable GIF. A truncated file reports the frames
 * read before the truncation.
 */
export function parseGifAnimationInfo(
  bytes: Uint8Array
): GifAnimationInfo | null {
  if (bytes.length < GIF_HEADER_LENGTH) return null;
  const signature = String.fromCodePoint(...bytes.subarray(0, 6));
  if (signature !== "GIF87a" && signature !== "GIF89a") return null;

  const width = bytes[6]! | (bytes[7]! << 8);
  const height = bytes[8]! | (bytes[9]! << 8);
  if (width === 0 || height === 0) return null;

  let index = GIF_HEADER_LENGTH + colorTableBytes(bytes[10]!);
  let frames = 0;
  let step = stepGifBlock(bytes, index);
  while (step !== null) {
    if (step.frame) frames += 1;
    index = step.next;
    step = index < bytes.length ? stepGifBlock(bytes, index) : null;
  }

  return frames === 0 ? null : { width, height, frames };
}

/** The first animated-preview limit this GIF exceeds, if any. */
export function getGifAnimatedPreviewIssue(
  info: GifAnimationInfo
): GifAnimatedPreviewIssue | null {
  if (info.frames < 2) return null;
  const framePixels = info.width * info.height;
  if (framePixels > GIF_ANIMATED_PREVIEW_MAX_FRAME_PIXELS) {
    return { kind: "framePixels", info };
  }
  if (info.frames > GIF_ANIMATED_PREVIEW_MAX_FRAMES) {
    return { kind: "frames", info };
  }
  if (framePixels * info.frames > GIF_ANIMATED_PREVIEW_MAX_TOTAL_PIXELS) {
    return { kind: "totalPixels", info };
  }
  return null;
}

/** Inspects a selected GIF file; resolves null for other files or bad data. */
export async function inspectGifAnimatedPreview(
  file: File
): Promise<GifAnimatedPreviewIssue | null> {
  if (file.type !== "image/gif" || file.size > MAX_INSPECTED_BYTES) {
    return null;
  }
  try {
    const info = parseGifAnimationInfo(
      new Uint8Array(await file.arrayBuffer())
    );
    return info ? getGifAnimatedPreviewIssue(info) : null;
  } catch {
    return null;
  }
}
