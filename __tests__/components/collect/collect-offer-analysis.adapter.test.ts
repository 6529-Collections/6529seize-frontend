import {
  buildOfferAnalysisRequest,
  offerAnalysisView,
} from "@/components/collect/collect-offer-analysis.adapter";
import { initialOfferRows } from "@/components/collect/collect-offer-plan.helpers";
import type { OfferPlanAnalysisInput } from "@/components/collect/collect-offer-plan.types";
import { analyzeCollectOffers } from "@/components/collect/analyze-collect-offers";
import { MARKET_WETH } from "@/components/collect/market-validation";
import type { ApiCollectOfferAnalysis } from "@/generated/models/ApiCollectOfferAnalysis";
import { ApiCollectOfferAnalysisRowStatusEnum } from "@/generated/models/ApiCollectOfferAnalysisRow";
import { ApiCollectOfferPriceReferenceKindEnum } from "@/generated/models/ApiCollectOfferPriceReference";
import { commonApiPost } from "@/services/api/common-api";
import { offerAsset, OFFER_PAYER } from "./offer-plan.fixture";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
const NOW = 1800000000000;
function input(): OfferPlanAnalysisInput {
  return {
    profileId: "profile",
    wallet: OFFER_PAYER,
    controls: {
      method: "manual",
      percent: "5",
      budgetEth: "",
      expiryHours: "168",
    },
    committedAmountWei: "0",
    rows: initialOfferRows([{ asset: offerAsset(1), quantity: "2" }]).map(
      (row) => ({ ...row, unitPriceEth: "0.1" })
    ),
  };
}
function response(): ApiCollectOfferAnalysis {
  return {
    analysis_id: "analysis",
    profile_id: "profile",
    wallet: OFFER_PAYER,
    recipient: OFFER_PAYER,
    currency: MARKET_WETH,
    signing_policy: "INDIVIDUAL_OFFERS",
    policy_version: "opening-v1",
    policy_description: "Fixed conservative opening parameters.",
    created_at: NOW,
    valid_until: NOW + 60000,
    coverage: {
      complete: false,
      indexed_complete: true,
      evaluated_order_count: 2,
      applicable_order_count: 1,
      external_orders: "NOT_COMPREHENSIVE",
      funding_reserved: false,
      execution_verified: false,
    },
    totals: {
      proposed_weth_wei: "200000000000000000",
      available_weth_wei: "900000000000000000",
      weth_balance_wei: "1000000000000000000",
      tracked_payer_liability_wei: "100000000000000000",
      unallocated_weth_wei: "700000000000000000",
    },
    rows: [
      {
        asset: offerAsset(1),
        asset_key: offerAsset(1).asset_key,
        quantity: "2",
        pinned: true,
        selected: true,
        status: ApiCollectOfferAnalysisRowStatusEnum.Priced,
        unit_amount_wei: "100000000000000000",
        total_amount_wei: "200000000000000000",
        reason_codes: ["MANUAL_PRICE"],
        references: [],
      },
    ],
  };
}

describe("offer analysis request", () => {
  it("sends exact per-unit prices and quantity, payer delivery, and a fresh explicit expiry", () => {
    const request = buildOfferAnalysisRequest(input(), NOW);
    expect(request.assets).toEqual([
      {
        asset_key: offerAsset(1).asset_key,
        quantity: "2",
        manual_unit_amount_wei: "100000000000000000",
      },
    ]);
    expect(request).toMatchObject({
      recipient: OFFER_PAYER,
      acknowledge_external_recipient: false,
      expires_at: NOW / 1000 + 168 * 3600,
      method: { kind: "manual" },
    });
    expect(request.max_total_weth_wei).toBeUndefined();
  });
  it("requires every manual price and retains pins in formula methods", () => {
    const draft = input();
    expect(() =>
      buildOfferAnalysisRequest(
        {
          ...draft,
          rows: draft.rows.map((row) => ({ ...row, unitPriceEth: "" })),
        },
        NOW
      )
    ).toThrow();
    const formula = {
      ...draft,
      controls: {
        ...draft.controls,
        method: "improve_bid" as const,
        percent: "0.01",
      },
    };
    expect(buildOfferAnalysisRequest(formula, NOW)).toMatchObject({
      assets: [{ asset_key: offerAsset(1).asset_key, quantity: "2" }],
      method: { basis_points: 1 },
    });
    expect(
      buildOfferAnalysisRequest(
        {
          ...formula,
          rows: draft.rows.map((row) => ({ ...row, pinned: true })),
        },
        NOW
      ).assets[0]?.manual_unit_amount_wei
    ).toBe("100000000000000000");
  });
  it("reduces goal capacity by actual commitments and rejects an exhausted budget", () => {
    const draft = input();
    const goal = {
      ...draft,
      committedAmountWei: "300000000000000001",
      controls: { ...draft.controls, method: "goal" as const, budgetEth: "1" },
    };
    expect(buildOfferAnalysisRequest(goal, NOW).max_total_weth_wei).toBe(
      "699999999999999999"
    );
    expect(() =>
      buildOfferAnalysisRequest(
        { ...goal, committedAmountWei: "1000000000000000000" },
        NOW
      )
    ).toThrow();
  });
  it("rejects duplicate, excessive, malformed or unselected inputs", () => {
    const draft = input();
    for (const rows of [
      [],
      [...draft.rows, ...draft.rows],
      Array.from({ length: 1001 }, () => draft.rows[0]!),
      draft.rows.map((row) => ({ ...row, assetKey: `${row.assetKey}:other` })),
      draft.rows.map((row) => ({ ...row, selected: false })),
    ]) {
      expect(() =>
        buildOfferAnalysisRequest({ ...draft, rows }, NOW)
      ).toThrow();
    }
  });
});

describe("offer analysis response binding", () => {
  it("maps exact rows and the funding snapshot without passing prepare instructions", () => {
    const view = offerAnalysisView(
      response(),
      buildOfferAnalysisRequest(input(), NOW),
      NOW
    );
    expect(view.prices[0]).toMatchObject({
      assetKey: offerAsset(1).asset_key,
      quantity: "2",
      unitAmountWei: "100000000000000000",
    });
    expect(view.availableWei).toBe("900000000000000000");
    expect(view.policyDescription).toBe(
      "Fixed conservative opening parameters."
    );
    expect(view).not.toHaveProperty("prepare_request");
  });
  it.each<[string, (result: ApiCollectOfferAnalysis) => void]>([
    [
      "profile",
      (result) => {
        result.profile_id = "other";
      },
    ],
    [
      "payer",
      (result) => {
        result.wallet = "0x2222222222222222222222222222222222222222";
      },
    ],
    [
      "recipient",
      (result) => {
        result.recipient = "0x2222222222222222222222222222222222222222";
      },
    ],
    [
      "currency",
      (result) => {
        result.currency = "ETH";
      },
    ],
    [
      "signing policy",
      (result) => {
        result.signing_policy = "BATCH_AUTOSIGN";
      },
    ],
    [
      "expiry",
      (result) => {
        result.valid_until = NOW;
      },
    ],
    [
      "quantity",
      (result) => {
        result.rows[0]!.quantity = "1";
      },
    ],
    [
      "duplicate row",
      (result) => {
        result.rows.push(result.rows[0]!);
      },
    ],
    [
      "metadata token",
      (result) => {
        result.rows[0]!.asset!.token_id = "2";
      },
    ],
    [
      "manual pin",
      (result) => {
        result.rows[0]!.unit_amount_wei = "200000000000000000";
        result.rows[0]!.total_amount_wei = "400000000000000000";
      },
    ],
    [
      "total conservation",
      (result) => {
        result.rows[0]!.total_amount_wei = "1";
      },
    ],
    [
      "liability conservation",
      (result) => {
        result.totals.available_weth_wei = "1000000000000000000";
      },
    ],
    [
      "proposal conservation",
      (result) => {
        result.totals.proposed_weth_wei = "1";
      },
    ],
    [
      "invented reserve",
      (result) => {
        result.coverage.funding_reserved = true;
      },
    ],
    [
      "invalid amount",
      (result) => {
        result.rows[0]!.unit_amount_wei = "1e18";
      },
    ],
  ])("rejects a changed %s", (_name, change) => {
    const result = response();
    change(result);
    expect(() =>
      offerAnalysisView(result, buildOfferAnalysisRequest(input(), NOW), NOW)
    ).toThrow();
  });
  it("preserves an unresolved NFT and rejects references falsely claiming verified funding", () => {
    const draft = input();
    const request = buildOfferAnalysisRequest(
      { ...draft, controls: { ...draft.controls, method: "match_bid" } },
      NOW
    );
    const result = response(),
      row = result.rows[0]!;
    row.pinned = false;
    row.selected = false;
    row.status = ApiCollectOfferAnalysisRowStatusEnum.Unavailable;
    delete row.unit_amount_wei;
    delete row.total_amount_wei;
    delete row.asset;
    row.reason_codes = ["NO_APPLICABLE_BID"];
    result.totals.proposed_weth_wei = "0";
    result.totals.unallocated_weth_wei = result.totals.available_weth_wei;
    expect(offerAnalysisView(result, request, NOW).prices[0]).toMatchObject({
      unitAmountWei: null,
      selected: false,
    });
    row.references = [
      {
        kind: ApiCollectOfferPriceReferenceKindEnum.Bid,
        order_hash: `0x${"1".repeat(64)}`,
        protocol_address: OFFER_PAYER,
        maker: OFFER_PAYER,
        currency: MARKET_WETH,
        quantity: "2",
        unit_amount_wei: "1",
        total_amount_wei: "2",
        observed_at: NOW,
        expires_at: NOW + 60000,
        source: "OpenSea",
        eligibility: "EXACT_TOKEN_TERMS",
        verification: "OBSERVED_NOT_CHAIN_VERIFIED",
        funding: "VERIFIED",
      },
    ];
    expect(() => offerAnalysisView(result, request, NOW)).toThrow();
    row.references[0]!.funding = "UNKNOWN";
    expect(
      offerAnalysisView(result, request, NOW).prices[0]?.references[0]
    ).toMatchObject({ amountWei: "1", currency: "WETH" });
  });
  it("uses the shared authenticated API helper once, without any operation creation", async () => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    const fixture = response();
    jest.mocked(commonApiPost).mockImplementationOnce(async ({ body }) => {
      expect(body).toMatchObject({
        profile_id: fixture.profile_id,
        wallet: fixture.wallet,
        recipient: fixture.recipient,
      });
      return fixture;
    });
    const result = await analyzeCollectOffers(input());
    expect(result).toMatchObject({ id: "analysis" });
    expect(commonApiPost).toHaveBeenCalledTimes(1);
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "collect/offer-analyses",
        errorMode: "structured",
        body: expect.objectContaining({ recipient: OFFER_PAYER }),
      })
    );
    jest.restoreAllMocks();
  });
});
