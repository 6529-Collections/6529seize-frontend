import { parsePositiveWholeNumberInput } from "@/components/waves/create-wave/utils/positiveWholeNumberInput";

describe("parsePositiveWholeNumberInput", () => {
  it("returns null for blank input", () => {
    expect(parsePositiveWholeNumberInput("")).toBeNull();
    expect(parsePositiveWholeNumberInput("  ")).toBeNull();
  });

  it("accepts positive whole numbers", () => {
    expect(parsePositiveWholeNumberInput("7")).toBe(7);
    expect(parsePositiveWholeNumberInput("007")).toBe(7);
  });

  it("rejects decimals, zero, negatives, and non-numeric values", () => {
    expect(parsePositiveWholeNumberInput("7.5")).toBeNull();
    expect(parsePositiveWholeNumberInput("0")).toBeNull();
    expect(parsePositiveWholeNumberInput("-7")).toBeNull();
    expect(parsePositiveWholeNumberInput("abc")).toBeNull();
  });
});
