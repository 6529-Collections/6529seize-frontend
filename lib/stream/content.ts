import { bytesToHex, keccak256, toBytes, type Hex } from "viem";

/** ContentStore stores files in chunks of at most this many bytes. */
const CHUNK_SIZE = 24_575;
/** Identity encoding: the stored bytes are the media itself. */
export const ENCODING_IDENTITY = 0;
/**
 * The largest primary file the create page stores: eight content-store chunks
 * (about 192 KB). Storing costs about 1,600 gas per byte on Sepolia, so the
 * page shows the estimated fee before anything is sent.
 */
export const MAX_MEDIA_BYTES = CHUNK_SIZE * 8;

export interface StoredFile {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  /** SHA-256 of the bytes, as the manifest and the work's media list declare it. */
  readonly sha256: Hex;
  /** keccak256 of each chunk, in order. */
  readonly chunkHashes: readonly Hex[];
  readonly chunks: readonly Uint8Array[];
}

function splitChunks(bytes: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    chunks.push(bytes.slice(offset, offset + CHUNK_SIZE));
  }
  return chunks;
}

async function sha256Of(bytes: Uint8Array): Promise<Hex> {
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

interface WorkRecord {
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
  { size: 2048, quality: 0.86 },
  { size: 1600, quality: 0.84 },
  { size: 1280, quality: 0.82 },
  { size: 1024, quality: 0.8 },
  { size: 768, quality: 0.76 },
  { size: 640, quality: 0.7 },
  { size: 512, quality: 0.66 },
];

/** Approximate Sepolia gas for one stored byte, measured on the r8 uploads. */
const GAS_PER_STORED_BYTE = 1_650n;
/** Approximate gas of the fixed steps: record, approval, start, edition sale, record publish. */
const FIXED_CREATE_GAS = 6_000_000n;

/** A rough total of the gas a create run uses, for the fee shown before it starts. */
export function estimateCreateGas(mediaBytes: number, recordSize: number): bigint {
  // The start file is about 1.5 KB; each file adds a manifest registration (~600k gas).
  const stored = BigInt(mediaBytes + recordSize + 1_500);
  const files = BigInt(Math.ceil(mediaBytes / CHUNK_SIZE) + 2);
  return stored * GAS_PER_STORED_BYTE + files * 600_000n + FIXED_CREATE_GAS;
}

/**
 * Shrinks a picked image to a WebP small enough to store on Sepolia. SVG and
 * files already under the limit are kept as they are.
 */
export async function prepareMedia(
  file: File
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const original = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type.toLowerCase();
  if (original.length <= MAX_MEDIA_BYTES && mimeType.startsWith("image/")) {
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
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return `data:${mimeType};base64,${btoa(binary)}`;
}
