import { isMissingOutcomeAmount } from "@/components/waves/create-wave/outcomes/outcomeValidation";

describe("isMissingOutcomeAmount", () => {
  it.each([
    null,
    undefined,
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])("treats %s as missing", (value) => {
    expect(isMissingOutcomeAmount(value)).toBe(true);
  });

  it.each([0.1, 1])("accepts the positive finite amount %s", (value) => {
    expect(isMissingOutcomeAmount(value)).toBe(false);
  });
});
