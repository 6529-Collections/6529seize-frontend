import { collectPlanAmount } from "@/components/collect/collect-plan-amounts";

test("compacts an estimate upward and retains every exact decimal", () => {
  expect(collectPlanAmount("en-US", "2183892939224800000")).toEqual({
    compact: "2.1839 ETH",
    exact: "2.1838929392248 ETH",
  });
  expect(collectPlanAmount("en-US", "25104378893752", 8)).toEqual({
    compact: "0.00002511 ETH",
    exact: "0.000025104378893752 ETH",
  });
});

test("distinguishes zero from a positive amount below the display precision", () => {
  expect(collectPlanAmount("en-US", "0").compact).toBe("0 ETH");
  expect(collectPlanAmount("en-US", "1")).toEqual({
    compact: "<0.0001 ETH",
    exact: "0.000000000000000001 ETH",
  });
  expect(collectPlanAmount("en-US", "1", 8).compact).toBe("<0.00000001 ETH");
});

test("keeps large integer precision without converting wei to a floating point number", () => {
  expect(
    collectPlanAmount("en-US", "90071992547409931234567890123456789")
  ).toEqual({
    compact: "90,071,992,547,409,931.2346 ETH",
    exact: "90,071,992,547,409,931.234567890123456789 ETH",
  });
});
