import { formatCollectReviewCap } from "@/components/collect/collect-review-presentation";
import type { SupportedLocale } from "@/i18n/locales";

describe("formatCollectReviewCap", () => {
  it.each([
    ["0", "0"],
    ["1", "0.00000001"],
    ["9999999999", "0.00000001"],
    ["10000000000", "0.00000001"],
    ["10000000001", "0.00000002"],
    ["123456780000000000", "0.12345678"],
    ["123456780000000001", "0.12345679"],
    ["999999999999999999", "1"],
    ["1000000000000000001", "1.00000001"],
    [
      "900719925474099312345678901234567890",
      "900,719,925,474,099,312.34567891",
    ],
  ])("rounds the default network cap %s wei upward", (wei, expected) => {
    expect(formatCollectReviewCap("en-US", wei)).toBe(expected);
  });

  it.each([
    ["0", "0"],
    ["1", "0.00001"],
    ["9999999999999", "0.00001"],
    ["10000000000000", "0.00001"],
    ["10000000000001", "0.00002"],
    ["123450000000000000", "0.12345"],
    ["123450000000000001", "0.12346"],
    ["999999999999999999", "1"],
    ["1000000000000000001", "1.00001"],
    ["900719925474099312345678901234567890", "900,719,925,474,099,312.34568"],
  ])("rounds a maximum %s wei upward to five decimals", (wei, expected) => {
    expect(formatCollectReviewCap("en-US", wei, 5)).toBe(expected);
  });

  it.each([
    ["0", "0"],
    ["1", "1"],
    ["999999999999999999", "1"],
    ["1000000000000000000", "1"],
    ["1000000000000000001", "2"],
  ])("supports whole-unit upward rounding for %s wei", (wei, expected) => {
    expect(formatCollectReviewCap("en-US", wei, 0)).toBe(expected);
  });

  it.each([
    ["0", "0"],
    ["1", "0.000000000000000001"],
    ["999999999999999999", "0.999999999999999999"],
    ["1000000000000000001", "1.000000000000000001"],
    [
      "900719925474099312345678901234567890",
      "900,719,925,474,099,312.34567890123456789",
    ],
  ])("retains exact wei at precision eighteen: %s", (wei, expected) => {
    expect(formatCollectReviewCap("en-US", wei, 18)).toBe(expected);
  });

  it("supports every integer precision between the endpoints", () => {
    for (let precision = 1; precision < 18; precision += 1) {
      expect(formatCollectReviewCap("en-US", "1", precision)).toBe(
        `0.${"0".repeat(precision - 1)}1`
      );
      expect(formatCollectReviewCap("en-US", "0", precision)).toBe("0");
    }
  });

  it.each<[SupportedLocale, string, string, string]>([
    ["en-US", "1,234.00000001", "1,234.00001", "1,234.000000000000000001"],
    ["en-GB", "1,234.00000001", "1,234.00001", "1,234.000000000000000001"],
    ["de-DE", "1.234,00000001", "1.234,00001", "1.234,000000000000000001"],
    [
      "fr-FR",
      "1\u202f234,00000001",
      "1\u202f234,00001",
      "1\u202f234,000000000000000001",
    ],
    ["es-ES", "1.234,00000001", "1.234,00001", "1.234,000000000000000001"],
  ])(
    "uses localized separators without numeric precision loss in %s",
    (locale, network, maximum, exact) => {
      const wei = "1234000000000000000001";
      expect(formatCollectReviewCap(locale, wei)).toBe(network);
      expect(formatCollectReviewCap(locale, wei, 5)).toBe(maximum);
      expect(formatCollectReviewCap(locale, wei, 18)).toBe(exact);
    }
  );

  it.each([-1, -0.5, 0.5, 5.5, 18.5, 19, Number.NaN, Infinity, -Infinity])(
    "rejects invalid precision %s",
    (precision) => {
      expect(() => formatCollectReviewCap("en-US", "1", precision)).toThrow(
        "INVALID_DISPLAY_PRECISION"
      );
    }
  );

  it.each([0, 5, 8, 18])(
    "rejects a negative amount before rounding at precision %i",
    (precision) => {
      expect(() => formatCollectReviewCap("en-US", "-1", precision)).toThrow(
        "INVALID_DISPLAY_AMOUNT"
      );
      expect(() =>
        formatCollectReviewCap("en-US", "-1000000000000000000", precision)
      ).toThrow("INVALID_DISPLAY_AMOUNT");
    }
  );
});
