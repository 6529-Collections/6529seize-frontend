import type { E2eeApiClient } from "./api";
import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  randomBytes,
  toArrayBuffer,
  u32be,
  utf8Encode,
} from "./bytes";
import type { PayloadAttachment } from "./payload";

/**
 * Contract section 6 media: chunked AES-256-GCM. Chunk i uses nonce
 * n XOR (0^8 || u32be(i)) and AAD "6529-e2ee-blob-v1" || u32be(i) || u32be(chunks).
 *
 * Plaintext chunks are 1 MiB minus the 16-byte GCM tag so every ciphertext
 * chunk stays within the server's "<= 1 MiB raw" chunk limit (4.1); receivers
 * decrypt each chunk independently, so the split size is not part of the format.
 */
export const BLOB_CHUNK_BYTES = 1024 * 1024;
const GCM_TAG_BYTES = 16;
export const PLAINTEXT_CHUNK_BYTES = BLOB_CHUNK_BYTES - GCM_TAG_BYTES;
export const MAX_BLOB_BYTES = 25 * 1024 * 1024;

const AAD_PREFIX = utf8Encode("6529-e2ee-blob-v1");

export class MediaError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = "MediaError";
    this.code = code;
  }
}

export function chunkNonce(nonceBase: Uint8Array, index: number): Uint8Array {
  if (nonceBase.length !== 12) {
    throw new MediaError("E2EE_MEDIA_BAD_NONCE");
  }
  const nonce = new Uint8Array(nonceBase);
  const counter = u32be(index);
  for (let offset = 0; offset < 4; offset += 1) {
    nonce[8 + offset] = (nonce[8 + offset] ?? 0) ^ (counter[offset] ?? 0);
  }
  return nonce;
}

export const chunkAad = (index: number, chunkCount: number): Uint8Array =>
  concatBytes(AAD_PREFIX, u32be(index), u32be(chunkCount));

const subtle = (): SubtleCrypto => {
  const value = globalThis.crypto.subtle as SubtleCrypto | undefined;
  if (!value) {
    throw new MediaError("E2EE_MEDIA_NO_WEBCRYPTO");
  }
  return value;
};

const importKey = (key: Uint8Array, usage: KeyUsage): Promise<CryptoKey> => {
  if (key.length !== 32) {
    throw new MediaError("E2EE_MEDIA_BAD_KEY");
  }
  return subtle().importKey("raw", toArrayBuffer(key), "AES-GCM", false, [
    usage,
  ]);
};

export const ciphertextSize = (plaintextBytes: number): number => {
  const chunks = Math.max(1, Math.ceil(plaintextBytes / PLAINTEXT_CHUNK_BYTES));
  return plaintextBytes + chunks * GCM_TAG_BYTES;
};

interface EncryptedMedia {
  key: Uint8Array;
  nonce: Uint8Array;
  chunks: Uint8Array[];
}

export async function encryptMedia(
  plaintext: Uint8Array
): Promise<EncryptedMedia> {
  if (ciphertextSize(plaintext.length) > MAX_BLOB_BYTES) {
    throw new MediaError("E2EE_TOO_LARGE");
  }
  const key = randomBytes(32);
  const nonce = randomBytes(12);
  const cryptoKey = await importKey(key, "encrypt");
  const count = Math.max(
    1,
    Math.ceil(plaintext.length / PLAINTEXT_CHUNK_BYTES)
  );
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < count; index += 1) {
    const part = plaintext.subarray(
      index * PLAINTEXT_CHUNK_BYTES,
      (index + 1) * PLAINTEXT_CHUNK_BYTES
    );
    const sealed = await subtle().encrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(chunkNonce(nonce, index)),
        additionalData: toArrayBuffer(chunkAad(index, count)),
        tagLength: 128,
      },
      cryptoKey,
      toArrayBuffer(part)
    );
    chunks.push(new Uint8Array(sealed));
  }
  return { key, nonce, chunks };
}

export async function decryptMedia(
  chunks: readonly Uint8Array[],
  key: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await importKey(key, "decrypt");
  const parts: Uint8Array[] = [];
  for (const [index, chunk] of chunks.entries()) {
    try {
      const opened = await subtle().decrypt(
        {
          name: "AES-GCM",
          iv: toArrayBuffer(chunkNonce(nonce, index)),
          additionalData: toArrayBuffer(chunkAad(index, chunks.length)),
          tagLength: 128,
        },
        cryptoKey,
        toArrayBuffer(chunk)
      );
      parts.push(new Uint8Array(opened));
    } catch {
      throw new MediaError("E2EE_MEDIA_DECRYPT");
    }
  }
  return concatBytes(...parts);
}

interface MediaInput {
  bytes: Uint8Array;
  mime: string;
  name: string;
  width?: number | undefined;
  height?: number | undefined;
}

export async function uploadMedia(input: {
  api: E2eeApiClient;
  g: string;
  deviceKey: string;
  media: MediaInput;
}): Promise<PayloadAttachment> {
  const sealed = await encryptMedia(input.media.bytes);
  const size = sealed.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const blob = await input.api.createBlob({
    group: input.g,
    uploader_device_key: input.deviceKey,
    size,
    chunk_count: sealed.chunks.length,
  });
  for (const [index, chunk] of sealed.chunks.entries()) {
    await input.api.putBlobChunk(blob.blob_id, index, {
      data: bytesToBase64(chunk),
    });
  }
  await input.api.completeBlob(blob.blob_id);
  const attachment: PayloadAttachment = {
    blob: blob.blob_id,
    k: bytesToBase64(sealed.key),
    n: bytesToBase64(sealed.nonce),
    chunks: sealed.chunks.length,
    mime: input.media.mime || "application/octet-stream",
    size: input.media.bytes.length,
    name: input.media.name || "file",
  };
  if (input.media.width !== undefined) {
    attachment.w = input.media.width;
  }
  if (input.media.height !== undefined) {
    attachment.h = input.media.height;
  }
  return attachment;
}

export async function downloadMedia(input: {
  api: E2eeApiClient;
  deviceKey: string;
  attachment: PayloadAttachment;
}): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < input.attachment.chunks; index += 1) {
    const chunk = await input.api.getBlobChunk(
      input.attachment.blob,
      index,
      input.deviceKey
    );
    chunks.push(base64ToBytes(chunk.data));
  }
  const plaintext = await decryptMedia(
    chunks,
    base64ToBytes(input.attachment.k),
    base64ToBytes(input.attachment.n)
  );
  if (plaintext.length !== input.attachment.size) {
    throw new MediaError("E2EE_MEDIA_SIZE");
  }
  return plaintext;
}

const INLINE_MIME =
  /^(?:image\/[a-z0-9.+-]+|video\/mp4|audio\/[a-z0-9.+-]+|application\/pdf|text\/plain)$/u;

/** Contract 6: only these types render inline; everything else downloads. */
export const isInlineMime = (mime: string): boolean =>
  INLINE_MIME.test(mime.toLowerCase());

const SAFE_IMAGE_MIME = /^image\/(?:png|jpeg|gif|webp|avif|bmp)$/u;

/** Raster image types that may render inline from a local object URL. */
export const isSafeInlineImageMime = (mime: string): boolean =>
  SAFE_IMAGE_MIME.test(mime.toLowerCase());

/**
 * Type for the local Blob of a decrypted attachment. The sender chooses the
 * declared type, and an object URL runs in this origin, so anything but a
 * raster image (HTML, SVG, scripts) becomes an opaque download.
 */
export const localBlobType = (mime: string): string =>
  isSafeInlineImageMime(mime) ? mime.toLowerCase() : "application/octet-stream";

async function imageSize(
  file: File
): Promise<{ width?: number; height?: number }> {
  if (
    !file.type.startsWith("image/") ||
    typeof createImageBitmap !== "function"
  ) {
    return {};
  }
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

export async function mediaFromFile(file: File): Promise<MediaInput> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = await imageSize(file);
  return {
    bytes,
    mime: file.type,
    name: file.name,
    width: size.width,
    height: size.height,
  };
}
