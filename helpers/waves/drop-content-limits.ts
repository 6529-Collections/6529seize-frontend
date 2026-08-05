export const MAX_DROP_PART_UTF16_UNITS = 25_000;
export const MAX_DROP_PART_UTF8_BYTES = 65_535;
export const MAX_DROP_STORM_UTF16_UNITS = 50_000;

export const getUtf8ByteLength = (value: string): number =>
  new TextEncoder().encode(value).byteLength;

export const isDropPartWithinLimits = (content: string): boolean =>
  content.length <= MAX_DROP_PART_UTF16_UNITS &&
  getUtf8ByteLength(content) <= MAX_DROP_PART_UTF8_BYTES;

