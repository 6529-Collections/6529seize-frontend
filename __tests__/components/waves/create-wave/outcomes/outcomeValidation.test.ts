import { isMissingOutcomeAmount } from "@/components/waves/create-wave/outcomes/outcomeValidation";

describe("isMissingOutcomeAmount", () => {
  it.each([null, undefined, 0, Number.NaN])("treats %s as missing", (value) => {
    expect(isMissingOutcomeAmount(value)).toBe(true);
  });

  it.each([1, -1, Number.POSITIVE_INFINITY])(
    "preserves the existing truthy-number behavior for %s",
    (value) => {
      expect(isMissingOutcomeAmount(value)).toBe(false);
    }
  );
});
