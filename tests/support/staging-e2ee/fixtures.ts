import { randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";

/**
 * Unique, secret-free content for one staging E2EE run. Every string is
 * random enough that finding it in a network body can only mean the
 * plaintext itself was sent.
 */

export function newRunId(): string {
  return randomBytes(4).toString("hex");
}

/** ASCII, so its wire encodings are unambiguous. */
export function qaMessage(runId: string, label: string): string {
  return `e2ee-qa ${runId} ${label}: ${randomBytes(12).toString("hex")} stays between us`;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

export interface QaImage {
  readonly name: string;
  readonly mimeType: "image/png";
  readonly buffer: Buffer;
  readonly width: number;
  readonly height: number;
  /** Row-major RGBA, alpha always 255. */
  readonly rgba: readonly number[];
  /** Also embedded in a PNG text chunk, to spot an unencrypted upload. */
  readonly marker: string;
}

/** A 2x2 opaque PNG with random pixels and a random text chunk. */
export function createQaImage(runId: string): QaImage {
  const width = 2;
  const height = 2;
  const rgba: number[] = [];
  const raw: number[] = [];
  const pixels = randomBytes(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    raw.push(0); // filter: none
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      const pixel = [
        pixels[offset] ?? 0,
        pixels[offset + 1] ?? 0,
        pixels[offset + 2] ?? 0,
        255,
      ];
      rgba.push(...pixel);
      raw.push(...pixel);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const marker = `e2ee-qa-attachment-${runId}-${randomBytes(8).toString("hex")}`;
  const buffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("tEXt", Buffer.from(`Comment\0${marker}`, "latin1")),
    pngChunk("IDAT", deflateSync(Buffer.from(raw))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return {
    name: `e2ee-qa-${runId}-${randomBytes(3).toString("hex")}.png`,
    mimeType: "image/png",
    buffer,
    width,
    height,
    rgba,
    marker,
  };
}
