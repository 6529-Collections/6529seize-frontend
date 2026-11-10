/**
 * Shared pieces of the image metadata strippers. Every stripper walks a
 * container, copies the blocks a decoder needs verbatim and drops the rest;
 * `describe` re-walks the output so the caller can prove nothing else moved.
 */

/** The container cannot be stripped safely; the caller keeps the original. */
export class StripUnsupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripUnsupported";
  }
}

export interface ContainerDescription {
  /** Stored (not oriented) size from the container header. */
  readonly width: number;
  readonly height: number;
  /** EXIF orientation 1-8 that decoders apply; 1 when absent. */
  readonly orientation: number;
  /**
   * Every byte range a decoder reads to render pixels and colour, in order
   * (image data, tables, palettes, colour profiles, animation control).
   */
  readonly render: readonly Uint8Array[];
  /** Identifying blocks present, for example `APP1:Exif` or `tEXt`. */
  readonly metadataBlocks: readonly string[];
}

export interface FormatStripper {
  strip(input: Uint8Array): Uint8Array;
  describe(input: Uint8Array): ContainerDescription;
}

export function assertWithin(input: Uint8Array, end: number, what: string) {
  if (!Number.isSafeInteger(end) || end > input.length) {
    throw new StripUnsupported(`Truncated ${what}`);
  }
}

const view = (input: Uint8Array): DataView =>
  new DataView(input.buffer, input.byteOffset, input.byteLength);

export function byteAt(input: Uint8Array, offset: number): number {
  assertWithin(input, offset + 1, "data");
  return input[offset] ?? 0;
}

export function u16(input: Uint8Array, offset: number, little: boolean) {
  assertWithin(input, offset + 2, "data");
  return view(input).getUint16(offset, little);
}

export function u32(input: Uint8Array, offset: number, little: boolean) {
  assertWithin(input, offset + 4, "data");
  return view(input).getUint32(offset, little);
}

export function latin1(input: Uint8Array, start: number, end: number) {
  let out = "";
  for (let index = start; index < end && index < input.length; index += 1) {
    out += String.fromCodePoint(input[index] ?? 0);
  }
  return out;
}

export function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (char) => char.codePointAt(0) ?? 0);
}

export function startsWithAt(
  input: Uint8Array,
  offset: number,
  signature: Uint8Array
): boolean {
  if (offset < 0 || offset + signature.length > input.length) {
    return false;
  }
  return signature.every((byte, index) => input[offset + index] === byte);
}

/** Byte-for-byte equality of two sequences of ranges, read as one stream. */
export function sameStream(
  a: readonly Uint8Array[],
  b: readonly Uint8Array[]
): boolean {
  const total = (parts: readonly Uint8Array[]) =>
    parts.reduce((sum, part) => sum + part.length, 0);
  if (total(a) !== total(b)) {
    return false;
  }
  const left = a.filter((part) => part.length > 0);
  const right = b.filter((part) => part.length > 0);
  let ai = 0;
  let aOffset = 0;
  let bi = 0;
  let bOffset = 0;
  for (;;) {
    const x = left[ai];
    const y = right[bi];
    if (!x || !y) {
      return !x && !y;
    }
    const run = Math.min(x.length - aOffset, y.length - bOffset);
    for (let index = 0; index < run; index += 1) {
      if (x[aOffset + index] !== y[bOffset + index]) {
        return false;
      }
    }
    aOffset += run;
    bOffset += run;
    if (aOffset === x.length) {
      ai += 1;
      aOffset = 0;
    }
    if (bOffset === y.length) {
      bi += 1;
      bOffset = 0;
    }
  }
}

/** One buffer from many parts (an array, not spread arguments: GIF and APNG can have thousands). */
export function joinBytes(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
