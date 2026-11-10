import { toArrayBuffer } from "./bytes";
import { MAX_ATTACHMENT_FILE_BYTES } from "./media";

const DOWNLOAD_TIMEOUT_MS = 30_000;
const GIPHY_MEDIA_HOST = /^media\d*\.giphy\.com$/u;

export class GifDownloadError extends Error {
  constructor(readonly reason: "tooLarge" | "unavailable") {
    super(`E2EE_GIF_${reason}`);
    this.name = "GifDownloadError";
  }
}

function validateGifUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !GIPHY_MEDIA_HOST.test(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    !url.pathname.toLowerCase().endsWith(".gif")
  ) {
    throw new GifDownloadError("unavailable");
  }
  return url;
}

async function readGif(response: Response): Promise<File> {
  if (!response.ok || !response.body) {
    throw new GifDownloadError("unavailable");
  }
  const declaredSize = response.headers.get("content-length");
  const size = declaredSize === null ? null : Number(declaredSize);
  if (
    declaredSize !== null &&
    (!/^\d+$/u.test(declaredSize) || !Number.isSafeInteger(size))
  ) {
    await response.body.cancel();
    throw new GifDownloadError("unavailable");
  }
  if (size !== null && size > MAX_ATTACHMENT_FILE_BYTES) {
    await response.body.cancel();
    throw new GifDownloadError("tooLarge");
  }
  const reader = response.body.getReader();
  const parts: ArrayBuffer[] = [];
  let receivedSize = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedSize += value.byteLength;
      if (receivedSize > MAX_ATTACHMENT_FILE_BYTES) {
        throw new GifDownloadError("tooLarge");
      }
      parts.push(toArrayBuffer(value));
    }
  } finally {
    await reader.cancel().catch(() => {
      // An errored stream may reject cancellation. Preserve the read error
      // (including the size-limit error) and always release its lock.
    });
    reader.releaseLock();
  }
  const file = new File(parts, "giphy.gif", { type: "image/gif" });
  const header = new Uint8Array(await file.slice(0, 6).arrayBuffer());
  const signature = String.fromCodePoint(...header);
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new GifDownloadError("unavailable");
  }
  return file;
}

/** Public GIPHY retrieval only. The returned file uses the normal E2EE upload. */
export async function downloadGiphyGif(
  value: string,
  signal: AbortSignal
): Promise<File> {
  const url = validateGifUrl(value);
  signal.throwIfAborted();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(cancel, DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(url.href, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      redirect: "error",
    });
    return await readGif(response);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
  }
}
