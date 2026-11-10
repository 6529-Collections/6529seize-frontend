import {
  ascii,
  assertWithin,
  byteAt,
  type ContainerDescription,
  type FormatStripper,
  joinBytes,
  startsWithAt,
  StripUnsupported,
  u16,
} from "./container";
import {
  isOrientationOnlyTiff,
  minimalOrientationJpegExifPayload,
  readTiffOrientation,
} from "./exif";

/**
 * JPEG: pixels, tables, ICC profile chunks (in order) and the Adobe colour
 * transform marker are kept verbatim; JFIF is kept without its thumbnail;
 * the first EXIF block becomes Orientation only; comments, XMP, IPTC and
 * every other application segment are dropped, as is anything after the
 * end-of-image marker. An HDR gain map (stored after the end of the image
 * and indexed by MPF or XMP) goes with them, leaving the standard-range
 * image.
 */

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP0 = 0xe0;
const APP1 = 0xe1;
const APP2 = 0xe2;
const APP14 = 0xee;
const APP15 = 0xef;
const COM = 0xfe;

const JFIF = ascii("JFIF\0");
const EXIF = ascii("Exif\0");
const ICC_PROFILE = ascii("ICC_PROFILE\0");
const ADOBE = ascii("Adobe");

/** 'JFIF\0', version, units, X/Y density and the X/Y thumbnail size. */
const JFIF_HEADER_BYTES = 14;

interface JpegSegment {
  readonly marker: number;
  /** Offset of the marker's 0xFF, after any fill bytes. */
  readonly start: number;
  readonly payloadStart: number;
  readonly payloadEnd: number;
  /** Segment end, including entropy-coded data after a scan header. */
  readonly end: number;
}

interface JpegLayout {
  readonly segments: readonly JpegSegment[];
  /** Offset just after the EOI marker. */
  readonly end: number;
}

type SegmentRole = "render" | "jfif" | "exif" | "drop";

const isStandaloneMarker = (marker: number): boolean =>
  marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);

const isFrameMarker = (marker: number): boolean =>
  marker >= 0xc0 &&
  marker <= 0xcf &&
  marker !== 0xc4 &&
  marker !== 0xc8 &&
  marker !== 0xcc;

/** Position of the marker byte pair, skipping optional 0xFF fill bytes. */
function markerStart(input: Uint8Array, position: number): number {
  if (position + 1 >= input.length || input[position] !== 0xff) {
    throw new StripUnsupported("JPEG marker expected before EOI");
  }
  let start = position;
  while (start + 1 < input.length && input[start + 1] === 0xff) {
    start += 1;
  }
  if (start + 1 >= input.length) {
    throw new StripUnsupported("JPEG ends before EOI");
  }
  return start;
}

/** Entropy-coded data runs to the first marker that is not a restart marker. */
function entropyEnd(input: Uint8Array, from: number): number {
  let index = from;
  for (;;) {
    index = input.indexOf(0xff, index);
    if (index < 0 || index + 1 >= input.length) {
      throw new StripUnsupported("Unterminated JPEG scan");
    }
    const next = byteAt(input, index + 1);
    if (next === 0xff) {
      index += 1;
    } else if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
      index += 2;
    } else {
      return index;
    }
  }
}

/** Walks the primary image from its SOI (at offset 0) to its EOI. */
function walkJpeg(input: Uint8Array): JpegLayout {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== SOI) {
    throw new StripUnsupported("Not a JPEG");
  }
  const segments: JpegSegment[] = [];
  let position = 2;
  for (;;) {
    const start = markerStart(input, position);
    const marker = byteAt(input, start + 1);
    if (marker === EOI || isStandaloneMarker(marker)) {
      const end = start + 2;
      segments.push({ marker, start, payloadStart: end, payloadEnd: end, end });
      if (marker === EOI) {
        return { segments, end };
      }
      position = end;
      continue;
    }
    if (marker === SOI || marker === 0x00) {
      throw new StripUnsupported("Unexpected JPEG marker");
    }
    const length = u16(input, start + 2, false);
    const payloadEnd = start + 2 + length;
    if (length < 2) {
      throw new StripUnsupported("Invalid JPEG segment");
    }
    assertWithin(input, payloadEnd, "JPEG segment");
    const end = marker === SOS ? entropyEnd(input, payloadEnd) : payloadEnd;
    segments.push({ marker, start, payloadStart: start + 4, payloadEnd, end });
    position = end;
  }
}

const payloadStartsWith = (
  input: Uint8Array,
  segment: JpegSegment,
  signature: Uint8Array
): boolean =>
  segment.payloadEnd - segment.payloadStart >= signature.length &&
  startsWithAt(input, segment.payloadStart, signature);

function segmentRole(input: Uint8Array, segment: JpegSegment): SegmentRole {
  const { marker } = segment;
  if (marker === COM) {
    return "drop";
  }
  if (marker < APP0 || marker > APP15) {
    return "render";
  }
  if (marker === APP0) {
    return payloadStartsWith(input, segment, JFIF) ? "jfif" : "drop";
  }
  if (marker === APP1) {
    return payloadStartsWith(input, segment, EXIF) ? "exif" : "drop";
  }
  if (marker === APP2) {
    return payloadStartsWith(input, segment, ICC_PROFILE) ? "render" : "drop";
  }
  if (marker === APP14) {
    return payloadStartsWith(input, segment, ADOBE) ? "render" : "drop";
  }
  return "drop";
}

const segmentBytes = (input: Uint8Array, segment: JpegSegment): Uint8Array =>
  input.subarray(segment.start, segment.end);

function jpegSegment(marker: number, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(4 + payload.length);
  out[0] = 0xff;
  out[1] = marker;
  new DataView(out.buffer).setUint16(2, payload.length + 2);
  out.set(payload, 4);
  return out;
}

/** A short (malformed) JFIF header has no room for thumbnail pixels. */
function jfifHasThumbnail(input: Uint8Array, segment: JpegSegment): boolean {
  const length = segment.payloadEnd - segment.payloadStart;
  if (length < JFIF_HEADER_BYTES) {
    return false;
  }
  const thumbnailPixels =
    byteAt(input, segment.payloadStart + 12) *
    byteAt(input, segment.payloadStart + 13);
  return thumbnailPixels > 0 || length > JFIF_HEADER_BYTES;
}

function jfifWithoutThumbnail(
  input: Uint8Array,
  segment: JpegSegment
): Uint8Array {
  if (!jfifHasThumbnail(input, segment)) {
    return segmentBytes(input, segment);
  }
  // Version, units and density are kept; the thumbnail size becomes 0x0.
  const payload = new Uint8Array(JFIF_HEADER_BYTES);
  payload.set(
    input.subarray(segment.payloadStart, segment.payloadStart + 12),
    0
  );
  return jpegSegment(APP0, payload);
}

const exifTiff = (input: Uint8Array, segment: JpegSegment): Uint8Array =>
  input.subarray(segment.payloadStart + 6, segment.payloadEnd);

function strip(input: Uint8Array): Uint8Array {
  const layout = walkJpeg(input);
  const parts: Uint8Array[] = [input.subarray(0, 2)];
  let exifSeen = false;
  for (const segment of layout.segments) {
    const role = segmentRole(input, segment);
    if (role === "render") {
      parts.push(segmentBytes(input, segment));
    } else if (role === "jfif") {
      parts.push(jfifWithoutThumbnail(input, segment));
    } else if (role === "exif" && !exifSeen) {
      exifSeen = true;
      const orientation = readTiffOrientation(exifTiff(input, segment));
      if (orientation !== 1) {
        parts.push(
          jpegSegment(APP1, minimalOrientationJpegExifPayload(orientation))
        );
      }
    }
  }
  return joinBytes(parts);
}

function frameSize(
  input: Uint8Array,
  layout: JpegLayout
): { width: number; height: number } {
  const frame = layout.segments.find((segment) =>
    isFrameMarker(segment.marker)
  );
  if (!frame || frame.payloadEnd - frame.payloadStart < 5) {
    throw new StripUnsupported("JPEG has no frame header");
  }
  return {
    width: u16(input, frame.payloadStart + 3, false),
    height: u16(input, frame.payloadStart + 1, false),
  };
}

function describe(input: Uint8Array): ContainerDescription {
  const layout = walkJpeg(input);
  const render: Uint8Array[] = [];
  const metadataBlocks: string[] = [];
  let orientation: number | undefined;
  for (const segment of layout.segments) {
    const role = segmentRole(input, segment);
    if (role === "render") {
      render.push(segmentBytes(input, segment));
    } else if (role === "jfif") {
      if (jfifHasThumbnail(input, segment)) {
        metadataBlocks.push("APP0:JFIF-thumbnail");
      }
    } else if (role === "exif") {
      const tiff = exifTiff(input, segment);
      orientation ??= readTiffOrientation(tiff);
      if (!isOrientationOnlyTiff(tiff)) {
        metadataBlocks.push("APP1:Exif");
      }
    } else {
      metadataBlocks.push(
        segment.marker === COM ? "COM" : `APP${segment.marker - APP0}`
      );
    }
  }
  if (layout.end !== input.length) {
    metadataBlocks.push("trailing-data");
  }
  return {
    ...frameSize(input, layout),
    orientation: orientation ?? 1,
    render,
    metadataBlocks,
  };
}

export const jpegStripper: FormatStripper = { strip, describe };
