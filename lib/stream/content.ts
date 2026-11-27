import { bytesToHex, keccak256, toBytes, type Hex } from "viem";

/** ContentStore stores files in chunks of at most this many bytes. */
export const CHUNK_SIZE = 24_575;
/** Identity encoding: the stored bytes are the media itself. */
export const ENCODING_IDENTITY = 0;
/**
 * The largest primary file the create page accepts. Storing a byte on
 * Sepolia costs about 1,600 gas, so this keeps a work's upload near 25M gas.
 */
export const MAX_MEDIA_BYTES = 16_384;

export interface StoredFile {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  /** SHA-256 of the bytes, as the manifest and the work's media list declare it. */
  readonly sha256: Hex;
  /** keccak256 of each chunk, in order. */
  readonly chunkHashes: readonly Hex[];
  readonly chunks: readonly Uint8Array[];
}

export function splitChunks(bytes: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    chunks.push(bytes.slice(offset, offset + CHUNK_SIZE));
  }
  return chunks;
}

export async function sha256Of(bytes: Uint8Array): Promise<Hex> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return bytesToHex(new Uint8Array(digest));
}

export async function toStoredFile(
  bytes: Uint8Array,
  mimeType: string
): Promise<StoredFile> {
  const chunks = splitChunks(bytes);
  return {
    bytes,
    mimeType,
    sha256: await sha256Of(bytes),
    chunks,
    chunkHashes: chunks.map((chunk) => keccak256(chunk)),
  };
}

export interface WorkRecord {
  readonly name: string;
  readonly description: string;
  readonly artist: string;
  readonly year: number;
}

/** The work's descriptive record, stored beside the media as JSON. */
export function recordBytes(record: WorkRecord): Uint8Array {
  return toBytes(
    JSON.stringify({
      name: record.name,
      description: record.description,
      artists: [record.artist],
      year: record.year,
    })
  );
}

const IMAGE_ATTEMPTS: readonly { size: number; quality: number }[] = [
  { size: 768, quality: 0.8 },
  { size: 640, quality: 0.72 },
  { size: 512, quality: 0.7 },
  { size: 448, quality: 0.6 },
  { size: 384, quality: 0.55 },
  { size: 320, quality: 0.5 },
];

/**
 * Shrinks a picked image to a WebP small enough to store on Sepolia. SVG and
 * files already under the limit are kept as they are.
 */
export async function prepareMedia(
  file: File
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const original = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type.toLowerCase();
  if (original.length <= MAX_MEDIA_BYTES && /^image\//.test(mimeType)) {
    return { bytes: original, mimeType };
  }
  if (!/^image\/(png|jpeg|webp|gif)$/.test(mimeType)) {
    return null;
  }
  const bitmap = await createImageBitmap(file);
  try {
    for (const attempt of IMAGE_ATTEMPTS) {
      const scale = Math.min(1, attempt.size / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", attempt.quality)
      );
      if (blob?.type === "image/webp" && blob.size <= MAX_MEDIA_BYTES) {
        return { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: "image/webp" };
      }
    }
  } finally {
    bitmap.close();
  }
  return null;
}

/** A data URL for stored media bytes, for showing a work's art. */
export function mediaDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${mimeType};base64,${btoa(binary)}`;
}
