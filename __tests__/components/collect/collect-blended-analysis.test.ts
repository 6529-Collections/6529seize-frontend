import { analyzeBlendedOffers } from "@/components/collect/collect-blended-analysis";
import { offerBuyOptions } from "@/components/collect/collect-offer-blend.helpers";
import { initialOfferRows } from "@/components/collect/collect-offer-plan.helpers";
import type {
  OfferPlanAnalysisInput,
  OfferPlanAnalysisView,
} from "@/components/collect/collect-offer-plan.types";
import { parseEther } from "viem";
import {
  offerAnalysis,
  offerAsset,
  offerPrice,
  OFFER_PAYER,
} from "./offer-plan.fixture";

function fixture() {
  const now = Date.now();
  const input: OfferPlanAnalysisInput = {
    profileId: "profile",
    wallet: OFFER_PAYER,
    committedAmountWei: "50000000000000000",
    controls: {
      method: "match_bid",
      blendTier: "base",
      percent: "5",
      budgetEth: "1",
      expiryHours: "168",
    },
    rows: initialOfferRows([
      { asset: offerAsset(1), quantity: "2" },
      { asset: offerAsset(2), quantity: "1" },
    ]).map((row, index) =>
      index === 1 ? { ...row, pinned: true, unitPriceEth: "0.125" } : row
    ),
  };
  const observed = {
    ...offerAnalysis(
      input.rows.map((row) => ({
        ...offerPrice(Number(row.assetKey.split(":")[2])),
        quantity: row.quantity,
        references: [
          {
            kind: "bid" as const,
            currency: "WETH" as const,
            amountWei: "100000000000000000",
            observedAt: new Date(now).toISOString(),
          },
        ],
      }))
    ),
    createdAt: new Date(now).toISOString(),
    validUntil: new Date(now + 30_000).toISOString(),
  };
  const analyze = jest
    .fn<Promise<OfferPlanAnalysisView>, [OfferPlanAnalysisInput]>()
    .mockImplementation(async (request) => {
      if (request.controls.method === "match_bid") return observed;
      return offerAnalysis(
        request.rows.map((row) => ({
          ...offerPrice(
            Number(row.assetKey.split(":")[2]),
            parseEther(row.unitPriceEth).toString()
          ),
          quantity: row.quantity,
        }))
      );
    });
  const policy = {
    tier: "base" as const,
    buyOptions: offerBuyOptions(input.rows, [
      {
        candidate_id: "listing",
        order_id: `0x${"1".repeat(64)}`,
        asset_key: offerAsset(1).asset_key,
        quantity: "2",
        unit_price_wei: "200000000000000000",
      },
    ]),
    buyObservedAt: new Date(now).toISOString(),
  };
  return { input, observed, analyze, policy, isCurrent: () => true };
}

it("rechecks exact per-NFT prices, quantities and budget without turning generated prices into user pins", async () => {
  const f = fixture();
  const originalRows = JSON.stringify(f.input.rows);
  const result = await analyzeBlendedOffers(f);
  expect(f.analyze).toHaveBeenCalledTimes(2);
  const funding = f.analyze.mock.calls[1]![0];
  expect(funding).toEqual(
    expect.objectContaining({
      profileId: "profile",
      wallet: OFFER_PAYER,
      committedAmountWei: "50000000000000000",
      controls: expect.objectContaining({ method: "manual", budgetEth: "1" }),
    })
  );
  expect(funding.rows[0]).toEqual(
    expect.objectContaining({
      quantity: "2",
      unitPriceEth: "0.133333333333333333",
      pinned: true,
    })
  );
  expect(funding.rows[1]).toEqual(
    expect.objectContaining({ unitPriceEth: "0.125", pinned: true })
  );
  expect(JSON.stringify(f.input.rows)).toBe(originalRows);
  expect(result?.view.validUntil).toBe(f.observed.validUntil);
  expect(result?.view.prices[0]?.references).toEqual(
    f.observed.prices[0]?.references
  );
  expect(result?.view.prices[0]?.unitAmountWei).toBe("133333333333333333");
});

it("does not return a reviewable proposal when the second analysis fails", async () => {
  const f = fixture();
  f.analyze
    .mockResolvedValueOnce(f.observed)
    .mockRejectedValueOnce(new Error("failed"));
  await expect(analyzeBlendedOffers(f)).rejects.toThrow("failed");
});

it.each(["amount", "quantity"] as const)(
  "rejects a changed %s from the funding check",
  async (changed) => {
    const f = fixture();
    f.analyze.mockResolvedValueOnce(f.observed).mockResolvedValueOnce(
      offerAnalysis([
        {
          ...offerPrice(1, changed === "amount" ? "1" : "133333333333333333"),
          quantity: changed === "quantity" ? "1" : "2",
        },
        offerPrice(2, "125000000000000000"),
      ])
    );
    await expect(analyzeBlendedOffers(f)).rejects.toThrow(
      "BLEND_FUNDING_TERMS_CHANGED"
    );
  }
);

it("stops before a second request when the original scope is no longer current", async () => {
  const f = fixture();
  expect(
    await analyzeBlendedOffers({ ...f, isCurrent: () => false })
  ).toBeNull();
  expect(f.analyze).toHaveBeenCalledTimes(1);
});

it("discards the funding result if the user changed scope during the second request", async () => {
  const f = fixture();
  const current = jest
    .fn()
    .mockReturnValueOnce(true)
    .mockReturnValueOnce(false);
  expect(await analyzeBlendedOffers({ ...f, isCurrent: current })).toBeNull();
  expect(f.analyze).toHaveBeenCalledTimes(2);
});

it("does not renew original references with the newer MANUAL response", async () => {
  const f = fixture();
  const clock = jest.spyOn(Date, "now");
  f.analyze
    .mockResolvedValueOnce(f.observed)
    .mockImplementationOnce(async (input) => {
      clock.mockReturnValue(Date.parse(f.observed.validUntil) + 1);
      return offerAnalysis(
        input.rows.map((row) => ({
          ...offerPrice(
            Number(row.assetKey.split(":")[2]),
            parseEther(row.unitPriceEth).toString()
          ),
          quantity: row.quantity,
        }))
      );
    });
  try {
    await expect(analyzeBlendedOffers(f)).rejects.toThrow(
      "BLEND_REFERENCE_EXPIRED"
    );
  } finally {
    clock.mockRestore();
  }
});

it("preserves a funding conflict instead of marking the recommendation priced", async () => {
  const f = fixture();
  f.analyze.mockResolvedValueOnce(f.observed).mockResolvedValueOnce({
    ...offerAnalysis([
      {
        ...offerPrice(1, "133333333333333333"),
        quantity: "2",
        status: "PIN_CONFLICT",
      },
      { ...offerPrice(2, "125000000000000000"), status: "PIN_CONFLICT" },
    ]),
    availableWei: "1",
  });
  const result = await analyzeBlendedOffers(f);
  expect(
    result?.view.prices.every((row) => row.status === "PIN_CONFLICT")
  ).toBe(true);
  expect(result?.view.availableWei).toBe("1");
});
