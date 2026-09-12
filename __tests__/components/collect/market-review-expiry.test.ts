import {
  isFreshMarketReviewExpiry,
  isValidMarketReviewExpiry,
} from "@/components/collect/market-review-expiry";
import {
  marketOperationReview,
  marketOperationStage,
} from "@/components/collect/market.adapters";
import { marketExecutionError } from "@/components/collect/market-execution-errors";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  type ApiMarketOperation,
  ApiMarketOperationStateEnum,
} from "@/generated/models/ApiMarketOperation";
import { t } from "@/i18n/messages";
import { zeroAddress } from "viem";

const NOW = 1_800_000_000_000;
const WALLET = "0x1111111111111111111111111111111111111111";

function operation(expiresAt: unknown): ApiMarketOperation {
  const result: ApiMarketOperation = {
    id: "purchase",
    revision: "review-1",
    state: ApiMarketOperationStateEnum.Review,
    profile_id: "profile",
    kind: ApiMarketKind.Buy,
    wallet: WALLET,
    recipient: WALLET,
    recipient_in_profile: true,
    asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1",
    quantity: "1",
    currency: zeroAddress,
    total_wei: "1000",
    net_wei: "950",
    fees: [{ recipient: WALLET, amount_wei: "50" }],
    approval_transactions: [],
    expires_at: NOW + 20_000,
    updated_at: NOW,
    potential_liability_wei: "0",
  };
  return Object.assign(result, { expires_at: expiresAt });
}

describe("market review expiry", () => {
  it.each([
    undefined,
    null,
    0,
    -1,
    NaN,
    Infinity,
    1.5,
    "1800000020000",
    [NOW + 20_000],
    8_640_000_000_000_001,
    Number.MAX_SAFE_INTEGER + 1,
  ])(
    "requires a refresh for an invalid deadline %p without an epoch date",
    (value) => {
      expect(isValidMarketReviewExpiry(value)).toBe(false);
      expect(isFreshMarketReviewExpiry(value, NOW)).toBe(false);
      const response = operation(value);
      expect(marketOperationReview(response, "en-US").expiresAt).toBeNull();
      expect(marketOperationStage(response)).toBe("review");
    }
  );

  it.each([NOW - 1, NOW])(
    "retains a real expired deadline %p for accurate display",
    (value) => {
      expect(isValidMarketReviewExpiry(value)).toBe(true);
      expect(isFreshMarketReviewExpiry(value, NOW)).toBe(false);
      expect(marketOperationReview(operation(value), "en-US").expiresAt).toBe(
        value
      );
    }
  );

  it("preserves an exact future millisecond deadline", () => {
    const deadline = NOW + 20_000;
    expect(isFreshMarketReviewExpiry(deadline, NOW)).toBe(true);
    expect(marketOperationReview(operation(deadline), "en-US").expiresAt).toBe(
      deadline
    );
  });

  it("does not promote an apparent seconds value into a fresh millisecond quote", () => {
    expect(isFreshMarketReviewExpiry(Math.floor(NOW / 1000) + 20, NOW)).toBe(
      false
    );
  });

  it("uses the current clock when no clock is supplied", () => {
    const clock = jest.spyOn(Date, "now").mockReturnValue(NOW);
    try {
      expect(isFreshMarketReviewExpiry(NOW + 1)).toBe(true);
      expect(isFreshMarketReviewExpiry(NOW)).toBe(false);
    } finally {
      clock.mockRestore();
    }
  });

  it("accepts the Date range boundary and rejects an invalid current clock", () => {
    expect(isValidMarketReviewExpiry(8_640_000_000_000_000)).toBe(true);
    expect(isFreshMarketReviewExpiry(NOW + 1, NaN)).toBe(false);
  });

  it("explains a refresh requirement without claiming that a wallet action failed", () => {
    expect(
      marketExecutionError(new Error("MARKET_REVIEW_REFRESH_REQUIRED"), "en-US")
    ).toBe(t("en-US", "collect.trade.refreshRequired"));
  });
});
