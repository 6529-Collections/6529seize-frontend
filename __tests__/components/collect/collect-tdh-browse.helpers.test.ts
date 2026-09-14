import { collectTdhValueLabel } from "@/components/collect/collect-tdh-browse.helpers";
import type { ApiCollectTdhListing } from "@/generated/models/ApiCollectTdhListing";

function listing(cost: string, rateHundredths: string): ApiCollectTdhListing {
  return {
    purchase_cost_wei: cost,
    base_tdh_per_day_hundredths: rateHundredths,
  } as ApiCollectTdhListing;
}

it("shows base rate per ETH rather than accumulated TDH or a hidden time projection", () => {
  expect(
    collectTdhValueLabel(listing("10000000000000000", "125"), "en-US")
  ).toBe("≈ 125");
});
it("normalizes a lot's total rate and total price to the same value as one copy", () => {
  expect(
    collectTdhValueLabel(listing("20000000000000000", "250"), "en-US")
  ).toBe(collectTdhValueLabel(listing("10000000000000000", "125"), "en-US"));
});
it("formats decimal values for the viewer locale", () => {
  expect(
    collectTdhValueLabel(listing("1000000000000000000", "125"), "de-DE")
  ).toBe("≈ 1,25");
});
it("does not invent an infinite value for a missing or zero cost", () => {
  expect(collectTdhValueLabel(listing("0", "125"), "en-US")).toBeNull();
});

it.each(["", "-1", "1.2", "1e18", "not a price"])(
  "does not display a fabricated ratio for malformed amount %s",
  (value) => {
    expect(collectTdhValueLabel(listing(value, "125"), "en-US")).toBeNull();
    expect(collectTdhValueLabel(listing("1", value), "en-US")).toBeNull();
  }
);
