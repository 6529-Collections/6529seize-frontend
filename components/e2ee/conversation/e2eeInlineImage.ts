/**
 * Guards for decrypted images shown inline. The sender controls the file and
 * its claimed size, so a small file can still decode into a huge bitmap.
 * Only images whose real dimensions stay under the cap are decoded, and only
 * a few at a time.
 */

/** About 200 MB of RGBA; larger images show as a file to download. */
const MAX_INLINE_IMAGE_PIXELS = 50_000_000;
/** Inline images fetched, decrypted and decoded at the same time. */
const MAX_CONCURRENT_INLINE_IMAGES = 3;

export const fitsInline = (width: number, height: number): boolean =>
  Number.isFinite(width) &&
  Number.isFinite(height) &&
  width > 0 &&
  height > 0 &&
  width * height <= MAX_INLINE_IMAGE_PIXELS;

let active = 0;
const waiting: (() => void)[] = [];

/**
 * Runs `task` once one of the inline-image slots is free. A finished task
 * hands its slot straight to the next waiter, so the cap always holds.
 */
export async function withInlineImageSlot<T>(
  task: () => Promise<T>
): Promise<T> {
  if (active >= MAX_CONCURRENT_INLINE_IMAGES) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    active += 1;
  }
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) {
      next();
    } else {
      active -= 1;
    }
  }
}

/**
 * Reads the image's real dimensions from its header (an off-document image
 * is not decoded to pixels on load), then decodes it only when it fits.
 * Resolves whether the image may render inline.
 */
export function prepareInlineImage(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onerror = () => reject(new Error("E2EE_IMAGE_UNREADABLE"));
    image.onload = () => {
      if (!fitsInline(image.naturalWidth, image.naturalHeight)) {
        image.removeAttribute("src");
        resolve(false);
        return;
      }
      image.decode().then(
        () => resolve(true),
        () => reject(new Error("E2EE_IMAGE_UNREADABLE"))
      );
    };
    image.src = url;
  });
}
