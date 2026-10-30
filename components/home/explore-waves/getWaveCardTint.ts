const SAMPLE_SIZE = 32;
const MAX_CACHED_TINTS = 64;
const tintCache = new Map<string, string | null>();

/** Sample the loaded thumbnail only; blocked canvas reads keep the Iron fallback. */
export function getWaveCardTint(image: HTMLImageElement): string | null {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight)
    return null;
  const source = image.currentSrc || image.src;
  if (!source) return null;
  if (tintCache.has(source)) return tintCache.get(source) ?? null;

  let tint: string | null = null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const { data } = context.getImageData(
        0,
        SAMPLE_SIZE / 2,
        SAMPLE_SIZE,
        SAMPLE_SIZE / 2
      );
      let red = 0;
      let green = 0;
      let blue = 0;
      let weight = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]! / 255;
        red += data[i]! * alpha;
        green += data[i + 1]! * alpha;
        blue += data[i + 2]! * alpha;
        weight += alpha;
      }
      if (weight > 0) {
        // Match the reference: 20% of the sampled color plus a dark base of 7.
        tint = `${Math.round((red / weight) * 0.2 + 7)} ${Math.round((green / weight) * 0.2 + 7)} ${Math.round((blue / weight) * 0.2 + 7)}`;
      }
    }
  } catch {
    // Cross-origin or unavailable pixels must never affect the displayed image.
  }

  if (tintCache.size >= MAX_CACHED_TINTS) {
    tintCache.delete(tintCache.keys().next().value!);
  }
  tintCache.set(source, tint);
  return tint;
}
