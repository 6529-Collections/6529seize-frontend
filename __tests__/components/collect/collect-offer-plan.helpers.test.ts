import {
  applyOfferPrices,
  initialOfferRows,
  offerBasisPoints,
  offerPlanScope,
  offerPlanTotals,
  offerPublishedTotal,
  offerQuantity,
  offerRowTotal,
  offerUnitWei,
} from "@/components/collect/collect-offer-plan.helpers";
import {
  offerAsset,
  offerPrice,
  OFFER_PAYER,
  OFFER_PROFILE,
} from "./offer-plan.fixture";

it("keeps 18-decimal prices exact and rejects unsupported input before order construction", () => {
  expect(offerUnitWei("0.000000000000000001")).toBe(1n);
  expect(offerUnitWei("12345678901234567890.123456789012345678")).toBe(
    12345678901234567890123456789012345678n
  );
  for (const invalid of [
    "",
    "0",
    "-1",
    "1e3",
    "01",
    "1.0000000000000000001",
    ".5",
    "NaN",
    " 1",
  ])
    expect(offerUnitWei(invalid)).toBeNull();
});
it("parses bounded exact percentage inputs without floating point rounding", () => {
  expect(offerBasisPoints("5.25", "improve_bid")).toBe(525);
  expect(offerBasisPoints("1000", "improve_bid")).toBe(100000);
  expect(offerBasisPoints("99.99", "discount_ask")).toBe(9999);
  for (const invalid of ["100", "-1", "5e1", "1.001", " 1"])
    expect(offerBasisPoints(invalid, "discount_ask")).toBeNull();
  expect(offerBasisPoints("1000.01", "improve_bid")).toBeNull();
});
it("combines selected editions without silently clamping an unsupported quantity", () => {
  const [row] = initialOfferRows([
    { asset: offerAsset(1), quantity: "60" },
    { asset: offerAsset(1), quantity: "50" },
  ]);
  expect(row?.quantity).toBe("110");
  expect(row && offerQuantity(row)).toBeNull();
});
it("accepts canonical unlisted NFT keys without inventing metadata", () => {
  const [row] = initialOfferRows([
    { assetKey: offerAsset(1).asset_key, quantity: "2" },
  ]);
  expect(row?.asset).toBeUndefined();
  expect(row && offerQuantity(row)).toBe(2n);
});
it("never overwrites a manual pin and clears a previous generated price when a reference disappears", () => {
  const original = initialOfferRows([
    { asset: offerAsset(1), quantity: "1" },
    { asset: offerAsset(2), quantity: "1" },
  ]);
  const rows = original.map((row, index) => ({
    ...row,
    unitPriceEth: "0.2",
    pinned: index === 0,
  }));
  const result = applyOfferPrices(
    rows,
    [offerPrice(1), offerPrice(2, null)],
    "match_bid"
  );
  expect(result[0]?.unitPriceEth).toBe("0.2");
  expect(result[1]?.unitPriceEth).toBe("");
  expect(result[1]?.selected).toBe(true);
});
it("only goal allocation may deselect an unpinned priced row", () => {
  const rows = initialOfferRows([{ asset: offerAsset(1), quantity: "1" }]);
  const price = {
    ...offerPrice(1),
    status: "EXCLUDED_BUDGET" as const,
    selected: false,
  };
  expect(applyOfferPrices(rows, [price], "match_bid")[0]?.selected).toBe(true);
  expect(applyOfferPrices(rows, [price], "goal")[0]?.selected).toBe(false);
});
it("counts each NFT quantity and every published commitment without reusing capital", () => {
  const rows = initialOfferRows([
    { asset: offerAsset(1), quantity: "2" },
    { asset: offerAsset(2), quantity: "1" },
  ]).map((row) => ({ ...row, unitPriceEth: "0.1" }));
  expect(rows[0] && offerRowTotal(rows[0])).toBe(200000000000000000n);
  expect(offerPlanTotals(rows, [offerAsset(1).asset_key])).toEqual({
    amount: 100000000000000000n,
    priced: 1,
    unresolved: 0,
  });
  expect(
    offerPublishedTotal([
      { assetKey: "same", amountWei: "10" },
      { assetKey: "same", amountWei: "20" },
    ])
  ).toBe(30n);
  expect(
    offerPublishedTotal([{ assetKey: "same", amountWei: "-1" }])
  ).toBeNull();
});
it("isolates private edits when profile membership changes", () => {
  const items = [{ asset: offerAsset(1), quantity: "1" }];
  const before = offerPlanScope(items, OFFER_PROFILE, OFFER_PAYER);
  const after = offerPlanScope(
    items,
    {
      ...OFFER_PROFILE,
      wallets: [
        {
          wallet: "0x2222222222222222222222222222222222222222",
          display: "new",
          tdh: 0,
        },
      ],
    },
    OFFER_PAYER
  );
  expect(before).not.toBe(after);
});
