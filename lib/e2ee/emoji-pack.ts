/** Public assets only. A client always downloads the complete catalog. */
export interface E2eeCustomEmoji {
  readonly id: string;
  readonly src: string;
}

export const E2EE_EMOJI_PACK_PATH = "/api/e2ee/emoji-pack";
export const CUSTOM_EMOJI_ID = /^[A-Za-z0-9_+-]{1,62}$/u;
const INLINE_RASTER =
  /^data:image\/(?:webp|png|gif|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/u;

export function parseE2eeEmojiPack(value: unknown): E2eeCustomEmoji[] {
  if (!Array.isArray(value) || value.length > 200) {
    throw new Error("Invalid emoji pack");
  }
  const seen = new Set<string>();
  return value.map((entry: unknown) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error("Invalid emoji");
    }
    const { id, src } = entry as Record<string, unknown>;
    if (
      typeof id !== "string" ||
      !CUSTOM_EMOJI_ID.test(id) ||
      seen.has(id) ||
      typeof src !== "string" ||
      !INLINE_RASTER.test(src)
    ) {
      throw new Error("Invalid emoji");
    }
    seen.add(id);
    return { id, src };
  });
}
