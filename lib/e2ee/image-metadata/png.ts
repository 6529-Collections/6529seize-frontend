import {
  ascii,
  assertWithin,
  type ContainerDescription,
  type FormatStripper,
  joinBytes,
  latin1,
  startsWithAt,
  StripUnsupported,
  u32,
} from "./container";
import {
  isOrientationOnlyTiff,
  minimalOrientationTiff,
  readTiffOrientation,
  withoutExifHeader,
} from "./exif";

const PNG_SIGNATURE = Uint8Array.of(
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a
);

/**
 * Chunks a decoder needs for pixels, transparency, colour (ICC, HDR) and
 * animation. Every other ancillary chunk (tEXt, zTXt, iTXt with XMP, tIME,
 * private chunks) is dropped; eXIf is reduced to Orientation.
 */
const RENDER_CHUNKS: ReadonlySet<string> = new Set([
  "IHDR",
  "PLTE",
  "IDAT",
  "IEND",
  "tRNS",
  "cHRM",
  "gAMA",
  "iCCP",
  "sBIT",
  "sRGB",
  "cICP",
  "mDCv",
  "cLLi",
  "bKGD",
  "hIST",
  "pHYs",
  "acTL",
  "fcTL",
  "fdAT",
]);

interface PngChunk {
  readonly type: string;
  readonly start: number;
  readonly dataStart: number;
  readonly dataEnd: number;
  readonly end: number;
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

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function walkPng(input: Uint8Array): {
  chunks: PngChunk[];
  trailingBytes: number;
} {
  if (!startsWithAt(input, 0, PNG_SIGNATURE)) {
    throw new StripUnsupported("Not a PNG");
  }
  const chunks: PngChunk[] = [];
  let position = PNG_SIGNATURE.length;
  for (;;) {
    assertWithin(input, position + 8, "PNG chunk");
    const length = u32(input, position, false);
    const type = latin1(input, position + 4, position + 8);
    if (!/^[A-Za-z]{4}$/u.test(type)) {
      throw new StripUnsupported("Invalid PNG chunk type");
    }
    const dataStart = position + 8;
    const dataEnd = dataStart + length;
    const end = dataEnd + 4;
    assertWithin(input, end, "PNG chunk");
    chunks.push({ type, start: position, dataStart, dataEnd, end });
    if (type === "IEND") {
      return { chunks, trailingBytes: input.length - end };
    }
    position = end;
  }
}

function chunkRole(type: string): "render" | "exif" | "drop" {
  if (RENDER_CHUNKS.has(type)) {
    return "render";
  }
  if (type === "eXIf") {
    return "exif";
  }
  // An unknown critical chunk (upper-case first letter) cannot be dropped.
  if (type.charAt(0) === type.charAt(0).toUpperCase()) {
    throw new StripUnsupported(`Unknown critical PNG chunk ${type}`);
  }
  return "drop";
}

const chunkTiff = (input: Uint8Array, chunk: PngChunk): Uint8Array =>
  withoutExifHeader(input.subarray(chunk.dataStart, chunk.dataEnd));

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(ascii(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function strip(input: Uint8Array): Uint8Array {
  const { chunks } = walkPng(input);
  const parts: Uint8Array[] = [PNG_SIGNATURE];
  let exifSeen = false;
  for (const chunk of chunks) {
    const role = chunkRole(chunk.type);
    if (role === "render") {
      parts.push(input.subarray(chunk.start, chunk.end));
    } else if (role === "exif" && !exifSeen) {
      exifSeen = true;
      const orientation = readTiffOrientation(chunkTiff(input, chunk));
      if (orientation !== 1) {
        parts.push(pngChunk("eXIf", minimalOrientationTiff(orientation)));
      }
    }
  }
  return joinBytes(parts);
}

function describe(input: Uint8Array): ContainerDescription {
  const { chunks, trailingBytes } = walkPng(input);
  const header = chunks[0];
  if (header?.type !== "IHDR" || header.dataEnd - header.dataStart < 13) {
    throw new StripUnsupported("PNG does not start with IHDR");
  }
  const render: Uint8Array[] = [];
  const metadataBlocks: string[] = [];
  let orientation: number | undefined;
  for (const chunk of chunks) {
    const role = chunkRole(chunk.type);
    if (role === "render") {
      render.push(input.subarray(chunk.start, chunk.end));
    } else if (role === "exif") {
      const tiff = chunkTiff(input, chunk);
      orientation ??= readTiffOrientation(tiff);
      if (!isOrientationOnlyTiff(tiff)) {
        metadataBlocks.push("eXIf");
      }
    } else {
      metadataBlocks.push(chunk.type);
    }
  }
  if (trailingBytes > 0) {
    metadataBlocks.push("trailing-data");
  }
  return {
    width: u32(input, header.dataStart, false),
    height: u32(input, header.dataStart + 4, false),
    orientation: orientation ?? 1,
    render,
    metadataBlocks,
  };
}

export const pngStripper: FormatStripper = { strip, describe };
