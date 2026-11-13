import {
  ascii,
  byteAt,
  type ContainerDescription,
  type FormatStripper,
  joinBytes,
  latin1,
  StripUnsupported,
  u16,
  u32,
} from "./container";
import {
  isOrientationOnlyTiff,
  minimalOrientationTiff,
  readTiffOrientation,
  withoutExifHeader,
} from "./exif";

const VP8X_EXIF_FLAG = 0x08;
const VP8X_XMP_FLAG = 0x04;
const VP8X_PAYLOAD_BYTES = 10;

/** Image data, alpha, colour profile and animation chunks; ANMF frames nest their own. */
const RENDER_CHUNKS: ReadonlySet<string> = new Set([
  "VP8 ",
  "VP8L",
  "ALPH",
  "ICCP",
  "ANIM",
  "ANMF",
]);

interface WebpChunk {
  readonly fourcc: string;
  readonly start: number;
  readonly dataStart: number;
  readonly dataEnd: number;
}

interface WebpLayout {
  readonly chunks: readonly WebpChunk[];
  readonly trailingBytes: number;
  /** VP8X flags, or null for a simple (VP8/VP8L-only) file. */
  readonly flags: number | null;
}

function walkWebp(input: Uint8Array): WebpLayout {
  if (
    input.length < 12 ||
    latin1(input, 0, 4) !== "RIFF" ||
    latin1(input, 8, 12) !== "WEBP"
  ) {
    throw new StripUnsupported("Not a WebP");
  }
  const riffEnd = 8 + u32(input, 4, true);
  if (riffEnd > input.length) {
    throw new StripUnsupported("Truncated WebP RIFF container");
  }
  const chunks: WebpChunk[] = [];
  let position = 12;
  while (position < riffEnd) {
    if (position + 8 > riffEnd) {
      throw new StripUnsupported("Truncated WebP chunk header");
    }
    const fourcc = latin1(input, position, position + 4);
    const size = u32(input, position + 4, true);
    const dataStart = position + 8;
    const dataEnd = dataStart + size;
    if (dataEnd > riffEnd) {
      throw new StripUnsupported("Truncated WebP chunk");
    }
    chunks.push({ fourcc, start: position, dataStart, dataEnd });
    // Tolerate a missing pad byte after an odd-sized final chunk.
    position = Math.min(dataEnd + (size & 1), riffEnd);
  }
  const first = chunks[0];
  if (!first) {
    throw new StripUnsupported("Empty WebP");
  }
  let flags: number | null = null;
  if (first.fourcc === "VP8X") {
    if (first.dataEnd - first.dataStart < VP8X_PAYLOAD_BYTES) {
      throw new StripUnsupported("Truncated VP8X chunk");
    }
    flags = byteAt(input, first.dataStart);
  }
  return { chunks, trailingBytes: input.length - riffEnd, flags };
}

function webpChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + data.length + (data.length % 2));
  out.set(ascii(fourcc), 0);
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

/** Header and payload, re-padded to an even length so later chunks stay aligned. */
function paddedChunk(input: Uint8Array, chunk: WebpChunk): Uint8Array {
  const bytes = input.subarray(chunk.start, chunk.dataEnd);
  return (chunk.dataEnd - chunk.dataStart) % 2 === 0
    ? bytes
    : joinBytes([bytes, new Uint8Array(1)]);
}

/** EXIF orientation only applies to an extended file that flags its EXIF chunk. */
const signalledExif = (layout: WebpLayout, chunk: WebpChunk): boolean =>
  chunk.fourcc === "EXIF" &&
  layout.flags !== null &&
  (layout.flags & VP8X_EXIF_FLAG) !== 0;

const chunkTiff = (input: Uint8Array, chunk: WebpChunk): Uint8Array =>
  withoutExifHeader(input.subarray(chunk.dataStart, chunk.dataEnd));

function strip(input: Uint8Array): Uint8Array {
  const layout = walkWebp(input);
  const parts: Uint8Array[] = [];
  let exifSeen = false;
  let exifWritten = false;
  let vp8x: Uint8Array | null = null;
  for (const [index, chunk] of layout.chunks.entries()) {
    if (index === 0 && layout.flags !== null) {
      vp8x = input.slice(chunk.dataStart, chunk.dataEnd);
      parts.push(new Uint8Array(0));
    } else if (RENDER_CHUNKS.has(chunk.fourcc)) {
      parts.push(paddedChunk(input, chunk));
    } else if (signalledExif(layout, chunk) && !exifSeen) {
      exifSeen = true;
      const orientation = readTiffOrientation(chunkTiff(input, chunk));
      if (orientation !== 1) {
        exifWritten = true;
        parts.push(webpChunk("EXIF", minimalOrientationTiff(orientation)));
      }
    }
  }
  const header = vp8x;
  if (header !== null) {
    const flags = (header[0] ?? 0) & ~(VP8X_EXIF_FLAG | VP8X_XMP_FLAG);
    header[0] = exifWritten ? flags | VP8X_EXIF_FLAG : flags;
    parts[0] = webpChunk("VP8X", header);
  }
  const body = joinBytes(parts);
  const out = new Uint8Array(12 + body.length);
  out.set(ascii("RIFF"), 0);
  new DataView(out.buffer).setUint32(4, body.length + 4, true);
  out.set(ascii("WEBP"), 8);
  out.set(body, 12);
  return out;
}

function imageSize(
  input: Uint8Array,
  chunk: WebpChunk
): { width: number; height: number } {
  const data = input.subarray(chunk.dataStart, chunk.dataEnd);
  const u24 = (offset: number) =>
    byteAt(data, offset) |
    (byteAt(data, offset + 1) << 8) |
    (byteAt(data, offset + 2) << 16);
  if (chunk.fourcc === "VP8X") {
    return { width: u24(4) + 1, height: u24(7) + 1 };
  }
  if (chunk.fourcc === "VP8 " && data.length >= 10) {
    return {
      width: u16(data, 6, true) & 0x3fff,
      height: u16(data, 8, true) & 0x3fff,
    };
  }
  if (chunk.fourcc === "VP8L" && data.length >= 5 && data[0] === 0x2f) {
    const bits = u32(data, 1, true);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1,
    };
  }
  throw new StripUnsupported("WebP has no readable image header");
}

function describe(input: Uint8Array): ContainerDescription {
  const layout = walkWebp(input);
  const render: Uint8Array[] = [];
  const metadataBlocks: string[] = [];
  let orientation: number | undefined;
  layout.chunks.forEach((chunk, index) => {
    if (index === 0 && layout.flags !== null) {
      const vp8x = input.slice(chunk.dataStart, chunk.dataEnd);
      vp8x[0] = (vp8x[0] ?? 0) & ~(VP8X_EXIF_FLAG | VP8X_XMP_FLAG);
      render.push(vp8x);
    } else if (RENDER_CHUNKS.has(chunk.fourcc)) {
      render.push(input.subarray(chunk.start, chunk.dataEnd));
    } else if (signalledExif(layout, chunk)) {
      const tiff = chunkTiff(input, chunk);
      orientation ??= readTiffOrientation(tiff);
      if (!isOrientationOnlyTiff(tiff)) {
        metadataBlocks.push("EXIF");
      }
    } else {
      metadataBlocks.push(chunk.fourcc.trim() || "unknown-chunk");
    }
  });
  if (layout.trailingBytes > 0) {
    metadataBlocks.push("trailing-data");
  }
  const first = layout.chunks[0];
  if (!first) {
    throw new StripUnsupported("Empty WebP");
  }
  return {
    ...imageSize(input, first),
    orientation: orientation ?? 1,
    render,
    metadataBlocks,
  };
}

export const webpStripper: FormatStripper = { strip, describe };
