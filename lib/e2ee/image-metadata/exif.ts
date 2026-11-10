import { ascii, latin1, startsWithAt, u16, u32 } from "./container";

/**
 * EXIF is reduced to its Orientation tag, which decoders apply when they
 * draw the image; every other tag (location, camera, serial numbers, times,
 * thumbnails) is dropped. Same policy as the server-side upload strip.
 */

const ORIENTATION_TAG = 0x0112;
const SHORT_TYPE = 3;
const EXIF_HEADER = ascii("Exif\0\0");

/** EXIF in WebP and PNG is a bare TIFF block, but some writers keep the JPEG prefix. */
export function withoutExifHeader(block: Uint8Array): Uint8Array {
  return startsWithAt(block, 0, EXIF_HEADER)
    ? block.subarray(EXIF_HEADER.length)
    : block;
}

interface Ifd {
  readonly little: boolean;
  readonly offset: number;
  readonly count: number;
  readonly entriesEnd: number;
}

function firstIfd(tiff: Uint8Array): Ifd | null {
  if (tiff.length < 8) {
    return null;
  }
  const order = latin1(tiff, 0, 2);
  if (order !== "II" && order !== "MM") {
    return null;
  }
  const little = order === "II";
  if (u16(tiff, 2, little) !== 42) {
    return null;
  }
  const offset = u32(tiff, 4, little);
  if (offset < 8 || offset + 2 > tiff.length) {
    return null;
  }
  const count = u16(tiff, offset, little);
  const entriesEnd = offset + 2 + count * 12;
  return entriesEnd > tiff.length
    ? null
    : { little, offset, count, entriesEnd };
}

/** Orientation 1-8 from IFD0, as decoders apply it; anything unreadable is upright. */
export function readTiffOrientation(tiff: Uint8Array): number {
  const ifd = firstIfd(tiff);
  if (!ifd) {
    return 1;
  }
  for (let index = 0; index < ifd.count; index += 1) {
    const entry = ifd.offset + 2 + index * 12;
    if (u16(tiff, entry, ifd.little) !== ORIENTATION_TAG) {
      continue;
    }
    if (
      u16(tiff, entry + 2, ifd.little) !== SHORT_TYPE ||
      u32(tiff, entry + 4, ifd.little) < 1
    ) {
      return 1;
    }
    const value = u16(tiff, entry + 8, ifd.little);
    return value >= 1 && value <= 8 ? value : 1;
  }
  return 1;
}

/** A 26-byte big-endian TIFF whose only content is IFD0 Orientation. */
export function minimalOrientationTiff(orientation: number): Uint8Array {
  const tiff = new Uint8Array(26);
  const data = new DataView(tiff.buffer);
  tiff.set(ascii("MM"), 0);
  data.setUint16(2, 42);
  data.setUint32(4, 8);
  data.setUint16(8, 1);
  data.setUint16(10, ORIENTATION_TAG);
  data.setUint16(12, SHORT_TYPE);
  data.setUint32(14, 1);
  data.setUint16(18, orientation);
  data.setUint32(22, 0);
  return tiff;
}

/** True only for an EXIF block that carries Orientation and nothing else. */
export function isOrientationOnlyTiff(tiff: Uint8Array): boolean {
  const ifd = firstIfd(tiff);
  if (!ifd || ifd.count !== 1 || tiff.length > 32) {
    return false;
  }
  const entry = ifd.offset + 2;
  return (
    u16(tiff, entry, ifd.little) === ORIENTATION_TAG &&
    u16(tiff, entry + 2, ifd.little) === SHORT_TYPE &&
    u32(tiff, entry + 4, ifd.little) === 1 &&
    ifd.entriesEnd + 4 <= tiff.length &&
    u32(tiff, ifd.entriesEnd, ifd.little) === 0
  );
}

export function minimalOrientationJpegExifPayload(
  orientation: number
): Uint8Array {
  const tiff = minimalOrientationTiff(orientation);
  const out = new Uint8Array(EXIF_HEADER.length + tiff.length);
  out.set(EXIF_HEADER, 0);
  out.set(tiff, EXIF_HEADER.length);
  return out;
}
