import { offerBuyOptions } from "@/components/collect/collect-offer-blend.helpers";
import { initialOfferRows } from "@/components/collect/collect-offer-plan.helpers";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { offerAsset } from "./offer-plan.fixture";

function leg(overrides: Partial<ApiCollectPlanLeg> = {}): ApiCollectPlanLeg {
  return {
    candidate_id: "listing",
    order_id: `0x${"1".repeat(64)}`,
    asset_key: offerAsset(1).asset_key,
    quantity: "1",
    unit_price_wei: "100000000000000000",
    ...overrides,
  };
}
const rows = (quantity: string) =>
  initialOfferRows([{ asset: offerAsset(1), quantity }]);

it("preserves exact listing legs and sums quantity and included-fee costs for the requested NFT", () => {
  const legs = [
    leg(),
    leg({
      candidate_id: "other",
      order_id: `0x${"2".repeat(64)}`,
      unit_price_wei: "200000000000000001",
    }),
  ];
  const option = offerBuyOptions(rows("2"), legs).get(offerAsset(1).asset_key);
  expect(option).toEqual({ legs, costWei: "300000000000000001" });
  expect(option?.legs[0]).toBe(legs[0]);
});

const unpriced = leg({ quantity: "2" });
delete unpriced.unit_price_wei;

it.each([
  ["partial quantity", [leg()]],
  ["excess quantity", [leg({ quantity: "3" })]],
  ["duplicate order", [leg(), leg()]],
  ["missing price", [unpriced]],
  ["malformed quantity", [leg({ quantity: "02" })]],
  ["invalid hash", [leg({ quantity: "2", order_id: "unknown" })]],
  [
    "overflow cost",
    [leg({ quantity: "2", unit_price_wei: ((1n << 256n) - 1n).toString() })],
  ],
] as const)("does not advertise Buy now for %s", (_label, legs) => {
  expect(offerBuyOptions(rows("2"), legs).size).toBe(0);
});

it("never borrows another NFT’s listing or advertises an invalid requested quantity", () => {
  expect(
    offerBuyOptions(rows("1"), [leg({ asset_key: offerAsset(2).asset_key })])
      .size
  ).toBe(0);
  expect(offerBuyOptions(rows("101"), [leg({ quantity: "101" })]).size).toBe(0);
});
