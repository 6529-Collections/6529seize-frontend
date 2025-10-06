import {
  MAX_ENUMERATION,
  MAX_SAFE,
  bigintCompare,
  expandRangesWindow,
  formatCanonical,
  fromCanonicalRanges,
  isRangeTooLargeError,
  parseTokenExpressionToBigints,
  parseTokenExpressionToRanges,
  sortAndDedupIds,
  toCanonicalRanges,
  tryToNumberArray,
} from "@/components/nft-picker/NftPicker.utils";

import type { TokenRange } from "@/components/nft-picker/NftPicker.types";

describe("NftPicker.utils", () => {
  describe("parseTokenExpressionToBigints", () => {
    it("parses decimal and range inputs", () => {
      const result = parseTokenExpressionToBigints("1,2,5-7");
      expect(result.map((value) => value.toString())).toEqual([
        "1",
        "2",
        "5",
        "6",
        "7",
      ]);
    });

    it("parses hexadecimal values", () => {
      const result = parseTokenExpressionToBigints("0x1A,0x1B-0x1D");
      expect(result.map((value) => value.toString(16))).toEqual([
        "1a",
        "1b",
        "1c",
        "1d",
      ]);
    });

    it("trims whitespace and normalises ranges", () => {
      const result = parseTokenExpressionToBigints("  1 - 3 , 5 \n");
      expect(result.map((value) => value.toString())).toEqual([
        "1",
        "2",
        "3",
        "5",
      ]);
    });

    it("swaps reversed ranges", () => {
      const result = parseTokenExpressionToBigints("5-2");
      expect(result.map((value) => value.toString())).toEqual([
        "2",
        "3",
        "4",
        "5",
      ]);
    });

    it("throws parse errors for invalid segments", () => {
      expect(() => parseTokenExpressionToBigints("1,foo"))
        .toThrow();
      try {
        parseTokenExpressionToBigints("1,foo");
      } catch (error) {
        expect(Array.isArray(error)).toBe(true);
        const errors = error as { message: string }[];
        expect(errors[0].message).toBe("Invalid token format");
      }
    });

    it("throws a parse error when a single range exceeds the enumeration ceiling", () => {
      expect(() => parseTokenExpressionToRanges("0-10000"))
        .toThrow();
      try {
        parseTokenExpressionToRanges("0-10000");
      } catch (error) {
        expect(Array.isArray(error)).toBe(true);
        const errors = error as { code?: string; message: string }[];
        expect(errors[0]?.code).toBe("range-too-large");
        expect(errors[0]?.message).toContain("exceeding the limit");
      }
    });

    it("throws a parse error when combined ranges exceed the enumeration ceiling", () => {
      const input = "0-5000,6000-11000";
      expect(() => parseTokenExpressionToBigints(input)).toThrow();
      try {
        parseTokenExpressionToBigints(input);
      } catch (error) {
        expect(Array.isArray(error)).toBe(true);
        const errors = error as { code?: string; message: string }[];
        expect(errors[0]?.code).toBe("range-too-large");
        expect(errors[0]?.message).toContain(MAX_ENUMERATION.toString());
      }
    });
  });

  it("sorts and deduplicates token ids", () => {
    const result = sortAndDedupIds([
      5n,
      3n,
      3n,
      4n,
      1n,
    ]);
    expect(result).toEqual([1n, 3n, 4n, 5n]);
  });

  it("converts to and from canonical ranges", () => {
    const ranges = toCanonicalRanges([1n, 2n, 3n, 5n, 6n]);
    expect(ranges).toEqual([
      { start: 1n, end: 3n },
      { start: 5n, end: 6n },
    ]);
    const expanded = fromCanonicalRanges(ranges);
    expect(expanded).toEqual([1n, 2n, 3n, 5n, 6n]);
  });

  it("throws a structured error when expanding canonical ranges beyond the ceiling", () => {
    const oversized = [{ start: 0n, end: 10_000n }];
    expect(() => fromCanonicalRanges(oversized)).toThrow();
    try {
      fromCanonicalRanges(oversized);
    } catch (error) {
      expect(isRangeTooLargeError(error)).toBe(true);
      if (isRangeTooLargeError(error)) {
        expect(error.limit).toBe(MAX_ENUMERATION);
        expect(error.size).toBe(10_001n);
      }
    }
  });

  it("formats canonical ranges", () => {
    const formatted = formatCanonical([
      { start: 1n, end: 3n },
      { start: 5n, end: 5n },
    ]);
    expect(formatted).toBe("1-3,5");
  });

  it("converts to numbers and counts unsafe values", () => {
    const { numbers, unsafeCount } = tryToNumberArray([1n, MAX_SAFE + 1n]);
    expect(numbers).toEqual([1]);
    expect(unsafeCount).toBe(1);
  });

  it("compares bigints", () => {
    expect(bigintCompare(1n, 2n)).toBe(-1);
    expect(bigintCompare(2n, 1n)).toBe(1);
    expect(bigintCompare(3n, 3n)).toBe(0);
  });

  it("expands ranges within a window", () => {
    const ranges: TokenRange[] = [
      { start: 1n, end: 3n },
      { start: 10n, end: 12n },
    ];
    const window = expandRangesWindow(ranges, 2, 4);
    expect(window).toEqual([3n, 10n, 11n, 12n]);
  });
});
