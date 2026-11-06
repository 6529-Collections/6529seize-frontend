import "server-only";
import { CUSTOM_EMOJI_ID, type E2eeCustomEmoji } from "./emoji-pack";

const CDN_BASE = "https://d3lqz0a4bldqgf.cloudfront.net/6529-emoji";
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_PACK_BYTES = 16 * 1024 * 1024;
const CACHE_MS = 24 * 60 * 60 * 1000;
let cached: { emojis: E2eeCustomEmoji[]; until: number } | null = null;
let pending: Promise<E2eeCustomEmoji[]> | null = null;

/** The existing catalog includes raster files whose .webp suffix is inaccurate. */
function imageMime(image: Buffer): string {
  if (
    image.toString("ascii", 0, 4) === "RIFF" &&
    image.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (
    image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (image.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
    return "image/jpeg";
  if (["GIF87a", "GIF89a"].includes(image.toString("ascii", 0, 6)))
    return "image/gif";
  throw new Error("Invalid emoji image");
}

async function readAsset(
  path: string,
  maxBytes: number,
  packSignal: AbortSignal
): Promise<Buffer> {
  // Every URL is fixed or built from a validated catalog ID, never chat text.
  const response = await fetch(`${CDN_BASE}/${path}`, {
    // Match the existing public asset proxy's CDN compatibility headers.
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.any([packSignal, AbortSignal.timeout(10_000)]),
  });
  if (!response.ok || !response.body)
    throw new Error("Emoji asset unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return Buffer.concat(chunks);
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Emoji asset too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

async function buildPack(): Promise<E2eeCustomEmoji[]> {
  const packSignal = AbortSignal.timeout(30_000);
  const list: unknown = JSON.parse(
    (await readAsset("emoji-list.json", 32_000, packSignal)).toString("utf8")
  );
  if (
    !Array.isArray(list) ||
    list.length === 0 ||
    list.length > 200 ||
    !list.every(
      (id: unknown) => typeof id === "string" && CUSTOM_EMOJI_ID.test(id)
    )
  ) {
    throw new Error("Invalid emoji catalog");
  }
  const ids = [...new Set(list as string[])];
  const emojis: E2eeCustomEmoji[] = [];
  let bytes = 0;
  // Bound fan-out; never publish a partial pack or fall back to per-emoji URLs.
  for (let offset = 0; offset < ids.length; offset += 8) {
    const batch = await Promise.all(
      ids.slice(offset, offset + 8).map(async (id) => {
        const image = await readAsset(
          `${id}.webp`,
          MAX_IMAGE_BYTES,
          packSignal
        );
        const mime = imageMime(image);
        return {
          id,
          src: `data:${mime};base64,${image.toString("base64")}`,
        };
      })
    );
    bytes += batch.reduce((sum, emoji) => sum + emoji.src.length, 0);
    if (bytes > MAX_PACK_BYTES) throw new Error("Emoji pack too large");
    emojis.push(...batch);
  }
  return emojis;
}

export async function getE2eeEmojiPack(): Promise<E2eeCustomEmoji[]> {
  if (cached && cached.until > Date.now()) return cached.emojis;
  pending ??= buildPack()
    .then((emojis) => {
      cached = { emojis, until: Date.now() + CACHE_MS };
      return emojis;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
