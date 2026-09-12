import {
  proposeBlendedPolicy,
  type BlendTier,
  type BlendedPolicyInput,
} from "@/components/collect/collect-blended-policy";
import { offerBuyOptions } from "@/components/collect/collect-offer-blend.helpers";
import { initialOfferRows } from "@/components/collect/collect-offer-plan.helpers";
import type {
  OfferPlanAnalysisView,
  OfferPlanPrice,
  OfferPlanRow,
} from "@/components/collect/collect-offer-plan.types";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { formatEther } from "viem";
import { offerAsset } from "./offer-plan.fixture";

const NOW = Date.parse("2026-09-12T12:00:00.000Z");
const AT = new Date(NOW).toISOString();
const DEADLINE = new Date(NOW + 60_000).toISOString();
const MAX = (1n << 256n) - 1n;
const key = (id = 1) => offerAsset(id).asset_key;

function row(
  id = 1,
  quantity = "1",
  overrides: Partial<OfferPlanRow> = {}
): OfferPlanRow {
  return {
    ...initialOfferRows([{ asset: offerAsset(id), quantity }])[0]!,
    ...overrides,
  };
}

function leg(
  id = 1,
  unit = "100",
  quantity = "1",
  hashDigit = "1"
): ApiCollectPlanLeg {
  return {
    candidate_id: `candidate-${id}-${hashDigit}`,
    order_id: `0x${hashDigit.repeat(64)}`,
    asset_key: key(id),
    unit_price_wei: unit,
    quantity,
  };
}

function price(
  id = 1,
  bid: string | null = "40",
  quantity = "1"
): OfferPlanPrice {
  return {
    assetKey: key(id),
    quantity,
    unitAmountWei: bid,
    status: bid === null ? "UNAVAILABLE" : "PRICED",
    selected: bid !== null,
    reasons: [],
    references:
      bid === null
        ? []
        : [{ kind: "bid", amountWei: bid, currency: "WETH", observedAt: AT }],
  };
}

function analysis(
  prices: readonly OfferPlanPrice[] = [price()]
): OfferPlanAnalysisView {
  return {
    id: "original-bid-analysis",
    policy: "observed-policy",
    policyDescription: "Observed references",
    createdAt: AT,
    validUntil: DEADLINE,
    prices,
    trackedLiabilityWei: "0",
    balanceWei: "1000",
    availableWei: "1000",
    unallocatedWei: "1000",
  };
}

function input(
  overrides: Partial<BlendedPolicyInput> = {}
): BlendedPolicyInput {
  const rows = [row()];
  return {
    tier: "base",
    rows,
    analysis: analysis(),
    buyOptions: offerBuyOptions(rows, [leg()]),
    buyObservedAt: AT,
    nowMs: NOW,
    ...overrides,
  };
}

function first(overrides: Partial<BlendedPolicyInput> = {}) {
  const proposal = proposeBlendedPolicy(input(overrides)).rows[0];
  if (!proposal) throw new Error("Expected a proposal");
  return proposal;
}

it.each<readonly [BlendTier, string]>([
  ["conservative", "40"],
  ["base", "60"],
  ["aggressive", "80"],
])(
  "%s interpolates within this NFT's own observed spread",
  (tier, unitAmountWei) => {
    expect(first({ tier })).toMatchObject({
      route: "offer",
      unitAmountWei,
      reason: "spread_offer",
      sourceValidUntil: DEADLINE,
    });
  }
);

it.each<readonly [BlendTier, string]>([
  ["conservative", "9800"],
  ["base", "9200"],
  ["aggressive", "8000"],
])(
  "%s buys at its exact inclusive spread boundary and offers one wei outside it",
  (tier, bid) => {
    const rows = [row()];
    const buyOptions = offerBuyOptions(rows, [leg(1, "10000")]);
    expect(
      first({ tier, buyOptions, analysis: analysis([price(1, bid)]) })
    ).toMatchObject({ route: "buy", reason: "tight_spread" });
    expect(
      first({
        tier,
        buyOptions,
        analysis: analysis([price(1, (BigInt(bid) - 1n).toString())]),
      }).route
    ).toBe("offer");
  }
);

it("chooses distinct routes and prices per NFT instead of applying a uniform percent", () => {
  const rows = [row(1), row(2)];
  const result = proposeBlendedPolicy(
    input({
      rows,
      buyOptions: offerBuyOptions(rows, [leg(), leg(2)]),
      analysis: analysis([price(1, "95"), price(2, "60")]),
    })
  );
  expect(result.rows).toEqual([
    expect.objectContaining({
      assetKey: key(1),
      route: "buy",
      reason: "tight_spread",
    }),
    expect.objectContaining({
      assetKey: key(2),
      route: "offer",
      unitAmountWei: "73",
    }),
  ]);
  expect([...result.buyKeys]).toEqual([key(1)]);
});

it.each<readonly [BlendTier, string | null, string]>([
  ["conservative", "70", "offer"],
  ["base", "85", "offer"],
  ["aggressive", null, "buy"],
])("%s handles an ask with no observed bid", (tier, unitAmountWei, route) => {
  expect(first({ tier, analysis: analysis([price(1, null)]) })).toMatchObject({
    route,
    unitAmountWei,
  });
});

it.each<BlendTier>(["conservative", "base", "aggressive"])(
  "%s matches a bid when no exact whole-quantity purchase is available",
  (tier) => {
    expect(first({ tier, buyOptions: new Map() })).toMatchObject({
      route: "offer",
      unitAmountWei: "40",
      reason: "bid_only",
    });
  }
);

it("does not invent a price when both sources are absent", () => {
  expect(
    first({ analysis: analysis([price(1, null)]), buyOptions: new Map() })
  ).toMatchObject({
    route: "manual",
    unitAmountWei: null,
    reason: "no_reference",
  });
});

it.each(["100", "101"])(
  "requires review of crossed bid %s instead of assuming arbitrage",
  (bid) => {
    expect(first({ analysis: analysis([price(1, bid)]) })).toMatchObject({
      route: "manual",
      unitAmountWei: null,
      reason: "crossed_market",
    });
  }
);

it("compares whole-row costs before division for an uneven three-edition lot", () => {
  const rows = [row(1, "3")];
  const legs = [
    leg(1, "3", "1", "1"),
    leg(1, "3", "1", "2"),
    leg(1, "4", "1", "3"),
  ];
  const buyOptions = offerBuyOptions(rows, legs);
  const shared = { rows, buyOptions, analysis: analysis([price(1, "3", "3")]) };
  expect(first({ ...shared, tier: "conservative" })).toMatchObject({
    route: "offer",
    unitAmountWei: "3",
  });
  expect(first({ ...shared, tier: "base" })).toMatchObject({
    route: "offer",
    unitAmountWei: "3",
  });
  expect(first({ ...shared, tier: "aggressive" })).toMatchObject({
    route: "buy",
    reason: "tight_spread",
  });
  expect(buyOptions.get(key())?.legs).toEqual(legs);
  expect(buyOptions.get(key())?.costWei).toBe("10");
});

it("rounds offer amounts down per edition and leaves indivisible wei uncommitted", () => {
  const rows = [row(1, "2")];
  const buyOptions = offerBuyOptions(rows, [
    leg(1, "2"),
    leg(1, "3", "1", "2"),
  ]);
  expect(
    first({
      tier: "aggressive",
      rows,
      buyOptions,
      analysis: analysis([price(1, "1", "2")]),
    })
  ).toMatchObject({ route: "offer", unitAmountWei: "2" });
});

it("does not round a zero-wei ask discount up into a made-up price", () => {
  const rows = [row(1, "2")];
  expect(
    first({
      rows,
      buyOptions: offerBuyOptions(rows, [leg(1, "1", "2")]),
      analysis: analysis([price(1, null, "2")]),
    })
  ).toMatchObject({
    route: "manual",
    reason: "invalid_amount",
    unitAmountWei: null,
  });
});

it("retains exact arithmetic beyond Number precision", () => {
  const amount = 10n ** 70n;
  const rows = [row()];
  expect(
    first({
      rows,
      buyOptions: offerBuyOptions(rows, [leg(1, amount.toString())]),
      analysis: analysis([price(1, (amount / 2n).toString())]),
    }).unitAmountWei
  ).toBe((amount / 2n + amount / 6n).toString());
});

it("rejects an offer total exceeding uint256 even though its unit is valid", () => {
  const rows = [row(1, "2")];
  expect(
    first({
      rows,
      buyOptions: new Map(),
      analysis: analysis([price(1, MAX.toString(), "2")]),
    })
  ).toMatchObject({ route: "manual", reason: "invalid_amount" });
});

it("retains a manual price through tier changes and a tight spread", () => {
  const rows = [row(1, "1", { pinned: true, unitPriceEth: formatEther(23n) })];
  for (const tier of ["conservative", "base", "aggressive"] as const)
    expect(
      first({ tier, rows, analysis: analysis([price(1, "99")]) })
    ).toMatchObject({
      route: "offer",
      unitAmountWei: "23",
      reason: "manual_price",
      sourceValidUntil: null,
    });
});

it("leaves an invalid manual price unresolved instead of replacing it", () => {
  expect(
    first({ rows: [row(1, "1", { pinned: true, unitPriceEth: "unfinished" })] })
  ).toMatchObject({
    route: "offer",
    unitAmountWei: null,
    reason: "manual_price",
  });
});

it("respects an explicit offer route even when the tier would buy", () => {
  expect(
    first({
      routeOverrides: new Map([[key(), "offer"]]),
      analysis: analysis([price(1, "99")]),
    })
  ).toMatchObject({ route: "offer", unitAmountWei: "99" });
});

it("preserves an explicit buy and a manual price for a later route change", () => {
  const rows = [row(1, "1", { pinned: true, unitPriceEth: formatEther(23n) })];
  expect(
    first({ rows, routeOverrides: new Map([[key(), "buy"]]) })
  ).toMatchObject({ route: "buy", unitAmountWei: "23", reason: "manual_buy" });
});

it("does not turn an unavailable explicit buy into an offer", () => {
  const proposal = proposeBlendedPolicy(
    input({ buyOptions: new Map(), routeOverrides: new Map([[key(), "buy"]]) })
  );
  expect(proposal.rows[0]).toMatchObject({
    route: "buy",
    reason: "buy_unavailable",
  });
  expect(proposal.buyKeys.has(key())).toBe(true);
});

it("locks pending commitments before any manual or automatic route", () => {
  const proposal = proposeBlendedPolicy(
    input({
      lockedAssetKeys: new Set([key()]),
      routeOverrides: new Map([[key(), "buy"]]),
      rows: [row(1, "1", { pinned: true, unitPriceEth: "1" })],
    })
  );
  expect(proposal.rows[0]).toMatchObject({ route: "locked", reason: "locked" });
  expect(proposal.buyKeys.size).toBe(0);
});

it("leaves deselected rows excluded", () => {
  expect(first({ rows: [row(1, "1", { selected: false })] })).toMatchObject({
    route: "excluded",
    reason: "excluded",
  });
});

it.each(["0", "101", "1.5"])(
  "rejects unsupported row quantity %s",
  (quantity) => {
    expect(first({ rows: [row(1, quantity)] })).toMatchObject({
      route: "manual",
      reason: "invalid_quantity",
    });
  }
);

it("does not reuse references or purchases for an old row quantity", () => {
  expect(first({ rows: [row(1, "2")] })).toMatchObject({
    route: "manual",
    reason: "no_reference",
  });
  expect(
    first({ rows: [row(1, "2")], analysis: analysis([price(1, "40", "2")]) })
  ).toMatchObject({ route: "offer", reason: "bid_only" });
});

it("preserves a manually chosen buy while its quantity is temporarily invalid", () => {
  const proposal = proposeBlendedPolicy(
    input({ rows: [row(1, "0")], routeOverrides: new Map([[key(), "buy"]]) })
  );
  expect(proposal.rows[0]).toMatchObject({
    route: "buy",
    reason: "invalid_quantity",
    unitAmountWei: null,
  });
  expect(proposal.buyKeys.has(key())).toBe(true);
});

it("caps a recommendation at the original bid reference age limit", () => {
  const reference = {
    kind: "bid" as const,
    amountWei: "40",
    currency: "WETH" as const,
    observedAt: new Date(NOW - 3_590_000).toISOString(),
  };
  const proposal = proposeBlendedPolicy(
    input({ analysis: analysis([{ ...price(), references: [reference] }]) })
  );
  expect(proposal.sourceValidUntil).toBe(new Date(NOW + 10_000).toISOString());
});

it.each([
  null,
  { ...analysis(), validUntil: AT },
  { ...analysis(), createdAt: DEADLINE },
  { ...analysis(), validUntil: new Date(NOW + 60_001).toISOString() },
])(
  "does not auto-price missing, expired, future or overlong analyses",
  (original) => {
    expect(first({ analysis: original })).toMatchObject({
      route: "manual",
      reason: "stale_reference",
      sourceValidUntil: null,
    });
  }
);

it.each([Number.NaN, Infinity, 0])(
  "rejects invalid now %s without validating old evidence",
  (nowMs) => {
    expect(first({ nowMs })).toMatchObject({
      route: "manual",
      reason: "stale_reference",
    });
  }
);

it("retains the earlier original ask deadline, not the newer funding-analysis time", () => {
  const buyObservedAt = new Date(NOW - 50_000).toISOString();
  const proposal = proposeBlendedPolicy(input({ buyObservedAt }));
  expect(proposal.sourceValidUntil).toBe(new Date(NOW + 10_000).toISOString());
  expect(first({ buyObservedAt, nowMs: NOW + 10_000 })).toMatchObject({
    route: "offer",
    reason: "bid_only",
  });
});

it("marks a stale explicit buy for refresh without changing its chosen route", () => {
  expect(
    first({
      buyObservedAt: new Date(NOW - 60_000).toISOString(),
      routeOverrides: new Map([[key(), "buy"]]),
    })
  ).toMatchObject({
    route: "buy",
    reason: "stale_reference",
    sourceValidUntil: null,
  });
});

it.each([undefined, "invalid", new Date(NOW + 15001).toISOString()])(
  "does not use an ask with unverified observation time %s",
  (buyObservedAt) => {
    expect(first({ buyObservedAt })).toMatchObject({
      route: "offer",
      reason: "bid_only",
    });
  }
);

it("does not use an ETH bid, a future reference or an expired source as WETH evidence", () => {
  for (const reference of [
    {
      kind: "bid" as const,
      amountWei: "40",
      currency: "ETH" as const,
      observedAt: AT,
    },
    {
      kind: "bid" as const,
      amountWei: "40",
      currency: "WETH" as const,
      observedAt: DEADLINE,
    },
    {
      kind: "bid" as const,
      amountWei: "40",
      currency: "WETH" as const,
      observedAt: new Date(NOW - 3_600_000).toISOString(),
    },
  ])
    expect(
      first({ analysis: analysis([{ ...price(), references: [reference] }]) })
    ).toMatchObject({ route: "manual", reason: "no_reference" });
});

it("does not treat proposal amounts as affordability or consume tracked commitments", () => {
  const original = {
    ...analysis(),
    balanceWei: "0",
    availableWei: "0",
    trackedLiabilityWei: "1000000",
  };
  const request = input({ analysis: original });
  const before = JSON.stringify({
    rows: request.rows,
    analysis: request.analysis,
    buys: [...request.buyOptions],
  });
  expect(proposeBlendedPolicy(request).rows[0]).toMatchObject({
    unitAmountWei: "60",
  });
  expect(
    JSON.stringify({
      rows: request.rows,
      analysis: request.analysis,
      buys: [...request.buyOptions],
    })
  ).toBe(before);
});

it("allows bounded server observation skew but never gives expired evidence a grace period", () => {
  const future = new Date(NOW + 15000).toISOString();
  const shifted: OfferPlanAnalysisView = {
    ...analysis(),
    createdAt: future,
    prices: [
      {
        ...price(),
        references: [
          {
            kind: "bid" as const,
            amountWei: "40",
            currency: "WETH",
            observedAt: future,
          },
        ],
      },
    ],
  };
  expect(first({ analysis: shifted, buyObservedAt: future }).route).toBe(
    "offer"
  );
  expect(
    first({
      analysis: { ...shifted, createdAt: new Date(NOW + 15001).toISOString() },
      buyObservedAt: future,
    }).reason
  ).toBe("stale_reference");
  expect(
    first({ analysis: { ...shifted, validUntil: AT }, buyObservedAt: future })
      .reason
  ).toBe("stale_reference");
});
