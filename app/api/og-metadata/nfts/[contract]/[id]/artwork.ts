import {
  getNftArtworkImageUrl,
  type BrandedNftOgImageModel,
} from "@/app/api/og-metadata/_lib/brandedCards";

const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 25_000;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_END = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];

const readBoundedBody = async (response: Response): Promise<Uint8Array> => {
  const declaredLength = Number(response.headers.get("content-length"));
  if (declaredLength > MAX_BYTES || response.body === null) {
    throw new Error("Artwork image exceeds the export limit or is empty.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      length += chunk.value.byteLength;
      if (length > MAX_BYTES) {
        await reader.cancel();
        throw new Error("Artwork image exceeds the export limit.");
      }
      chunks.push(chunk.value);
      chunk = await reader.read();
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

const validatePng = (bytes: Uint8Array): void => {
  if (
    bytes.length < 45 ||
    !PNG_SIGNATURE.every((value, index) => bytes[index] === value) ||
    !PNG_END.every((value, index) => bytes[bytes.length - 12 + index] === value)
  ) {
    throw new Error("Artwork image is not a complete PNG.");
  }
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = header.getUint32(16);
  const height = header.getUint32(20);
  if (
    header.getUint32(8) !== 13 ||
    header.getUint32(12) !== 0x49484452 ||
    width === 0 ||
    width > 1200 ||
    height === 0 ||
    height > 12_000
  ) {
    throw new Error("Artwork image has invalid dimensions.");
  }
};

const toDataUrl = (bytes: Uint8Array): string => {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(offset, offset + 32_768))
    );
  }
  return `data:image/png;base64,${btoa(chunks.join(""))}`;
};

export const prepareNftArtworkImage = async (
  model: BrandedNftOgImageModel,
  signal?: AbortSignal
): Promise<string> => {
  // This resolver always returns our image proxy. It validates public HTTPS
  // sources; the proxy additionally guards DNS/redirects and normalizes to PNG.
  const imageUrl = getNftArtworkImageUrl(model);
  if (imageUrl === null) {
    throw new Error("Artwork image is unavailable for export.");
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: "image/png" },
    });
    if (
      !response.ok ||
      response.headers.get("content-type")?.split(";", 1)[0]?.trim() !==
        "image/png"
    ) {
      throw new Error("Artwork image could not be prepared.");
    }
    const bytes = await readBoundedBody(response);
    validatePng(bytes);
    return toDataUrl(bytes);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
    controller.abort();
  }
};
