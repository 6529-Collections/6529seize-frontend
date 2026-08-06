import {
  MAX_DROP_PART_UTF16_UNITS,
  MAX_DROP_PART_UTF8_BYTES,
  getUtf8ByteLength,
  isDropPartWithinLimits,
} from "@/helpers/waves/drop-content-limits";

describe("drop content limits", () => {
  it("accepts and rejects the exact UTF-16 boundaries", () => {
    expect(isDropPartWithinLimits("a".repeat(MAX_DROP_PART_UTF16_UNITS))).toBe(
      true
    );
    expect(
      isDropPartWithinLimits("a".repeat(MAX_DROP_PART_UTF16_UNITS + 1))
    ).toBe(false);
  });

  it("accepts and rejects the exact UTF-8 boundaries", () => {
    const exactBytes = "界".repeat(MAX_DROP_PART_UTF8_BYTES / 3);
    const overBytes = `${exactBytes}界`;

    expect(getUtf8ByteLength(exactBytes)).toBe(MAX_DROP_PART_UTF8_BYTES);
    expect(isDropPartWithinLimits(exactBytes)).toBe(true);
    expect(getUtf8ByteLength(overBytes)).toBe(MAX_DROP_PART_UTF8_BYTES + 3);
    expect(isDropPartWithinLimits(overBytes)).toBe(false);
  });

  it("measures supplementary Unicode characters as UTF-8 and UTF-16", () => {
    const emoji = "😀";

    expect(emoji.length).toBe(2);
    expect(getUtf8ByteLength(emoji)).toBe(4);
    expect(isDropPartWithinLimits(emoji.repeat(12_500))).toBe(true);
  });
});
