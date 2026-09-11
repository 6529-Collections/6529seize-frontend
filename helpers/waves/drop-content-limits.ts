export const MAX_DROP_PART_UTF16_UNITS = 25_000;
export const MAX_DROP_PART_UTF8_BYTES = 65_535;
export const MAX_DROP_STORM_UTF16_UNITS = 50_000;

const MAX_UTF8_BYTES_PER_UTF16_UNIT = 3;
const MAX_UTF16_UNITS_WITHOUT_BYTE_MEASUREMENT = Math.floor(
  MAX_DROP_PART_UTF8_BYTES / MAX_UTF8_BYTES_PER_UTF16_UNIT
);
const utf8Encoder = new TextEncoder();

export const getUtf8ByteLength = (value: string): number =>
  utf8Encoder.encode(value).byteLength;

export const isDropPartWithinLimits = (content: string): boolean => {
  if (content.length > MAX_DROP_PART_UTF16_UNITS) {
    return false;
  }

  return (
    content.length <= MAX_UTF16_UNITS_WITHOUT_BYTE_MEASUREMENT ||
    getUtf8ByteLength(content) <= MAX_DROP_PART_UTF8_BYTES
  );
};
