import {
  buildCollectPurchaseAmounts,
  formatCollectNetworkFeeCap,
  formatCollectReviewWei,
} from "@/components/collect/collect-review-amounts";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  type ApiMarketOperation,
  ApiMarketOperationStateEnum,
} from "@/generated/models/ApiMarketOperation";
import {
  type ApiMarketTransaction,
  ApiMarketTransactionPurposeEnum,
} from "@/generated/models/ApiMarketTransaction";
import type { SupportedLocale } from "@/i18n/locales";
import { zeroAddress } from "viem";

const WALLET = "0x1111111111111111111111111111111111111111";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

function transaction(
  overrides: Partial<ApiMarketTransaction> = {}
): ApiMarketTransaction {
  return {
    chain_id: 1,
    to: WALLET,
    value: "1000",
    data: "0x",
    purpose: ApiMarketTransactionPurposeEnum.Fulfill,
    sender: WALLET,
    gas_reserve_wei: "300",
    ...overrides,
  };
}

function purchase(
  overrides: Partial<ApiMarketOperation> = {}
): ApiMarketOperation {
  return {
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
    net_wei: "925",
    fees: [
      { recipient: WALLET, amount_wei: "50" },
      { recipient: WALLET, amount_wei: "25" },
    ],
    approval_transactions: [],
    transaction: transaction(),
    expires_at: 1_900_000_000_000,
    updated_at: 1_800_000_000_000,
    potential_liability_wei: "0",
    ...overrides,
  };
}

function approval(gas: string, value = "0"): ApiMarketTransaction {
  return transaction({
    purpose: ApiMarketTransactionPurposeEnum.ApproveCurrency,
    gas_reserve_wei: gas,
    value,
  });
}

describe("buildCollectPurchaseAmounts", () => {
  it("keeps fees inside the purchase price and does not add the native payment twice", () => {
    expect(buildCollectPurchaseAmounts(purchase())).toEqual({
      purchaseWei: "1000",
      feesWei: "75",
      networkFeeCapWei: "300",
      maximumTotalWei: "1300",
    });
  });

  it("includes every required approval cap in the remaining transaction maximum", () => {
    expect(
      buildCollectPurchaseAmounts(
        purchase({
          approval_transactions: [approval("100"), approval("200")],
        })
      )
    ).toEqual({
      purchaseWei: "1000",
      feesWei: "75",
      networkFeeCapWei: "600",
      maximumTotalWei: "1600",
    });
  });

  it.each(["9", "-1", ""])(
    "does not report a maximum for unsupported approval value %s",
    (value) => {
      expect(
        buildCollectPurchaseAmounts(
          purchase({
            approval_transactions: [approval("100", value)],
          })
        )
      ).toMatchObject({ networkFeeCapWei: "400", maximumTotalWei: null });
    }
  );

  it("does not report a partial cap when the purchase transaction is not prepared", () => {
    const operation = purchase({ approval_transactions: [approval("100")] });
    delete operation.transaction;
    expect(buildCollectPurchaseAmounts(operation)).toEqual({
      purchaseWei: "1000",
      feesWei: "75",
      networkFeeCapWei: null,
      maximumTotalWei: null,
    });
  });

  it.each([0, 1, 2])(
    "requires the cap for transaction %i, including all approvals",
    (index) => {
      const required = [approval("100"), approval("200"), transaction()];
      const missing = required[index]!;
      delete missing.gas_reserve_wei;
      const operation = purchase({
        approval_transactions: required.slice(0, 2),
        transaction: required[2]!,
      });
      expect(buildCollectPurchaseAmounts(operation)).toMatchObject({
        networkFeeCapWei: null,
        maximumTotalWei: null,
      });
    }
  );

  it.each(["", "-1", "1.5", "1e3"])(
    "does not invent a total for malformed cap %s",
    (cap) => {
      expect(
        buildCollectPurchaseAmounts(
          purchase({
            transaction: transaction({ gas_reserve_wei: cap }),
          })
        )
      ).toMatchObject({ networkFeeCapWei: null, maximumTotalWei: null });
    }
  );

  it("keeps WETH purchase amounts separate from ETH approval and fulfillment caps", () => {
    expect(
      buildCollectPurchaseAmounts(
        purchase({
          currency: WETH,
          approval_transactions: [approval("100")],
          transaction: transaction({ value: "0" }),
        })
      )
    ).toEqual({
      purchaseWei: "1000",
      feesWei: "75",
      networkFeeCapWei: "400",
      maximumTotalWei: null,
    });
  });

  it("does not combine an unknown purchase currency with ETH gas", () => {
    expect(
      buildCollectPurchaseAmounts(purchase({ currency: WALLET }))
    ).toMatchObject({ networkFeeCapWei: "300", maximumTotalWei: null });
  });

  it("leaves the maximum unknown for an unbound native payment value", () => {
    expect(
      buildCollectPurchaseAmounts(
        purchase({
          transaction: transaction({ value: "1001" }),
        })
      )
    ).toMatchObject({ networkFeeCapWei: "300", maximumTotalWei: null });
  });

  it("retains known zero caps and zero fees", () => {
    expect(
      buildCollectPurchaseAmounts(
        purchase({
          fees: [],
          net_wei: "1000",
          transaction: transaction({ gas_reserve_wei: "0" }),
        })
      )
    ).toMatchObject({
      feesWei: "0",
      networkFeeCapWei: "0",
      maximumTotalWei: "1000",
    });
  });

  it("adds large wei amounts exactly beyond Number precision", () => {
    const large = "900719925474099312345678901234567890";
    expect(
      buildCollectPurchaseAmounts(
        purchase({
          total_wei: large,
          transaction: transaction({ value: large, gas_reserve_wei: "25" }),
        })
      )?.maximumTotalWei
    ).toBe("900719925474099312345678901234567915");
  });

  it.each([
    ApiMarketKind.Offer,
    ApiMarketKind.List,
    ApiMarketKind.Accept,
    ApiMarketKind.Cancel,
  ])("does not present %s as a purchase", (kind) =>
    expect(buildCollectPurchaseAmounts(purchase({ kind }))).toBeNull()
  );
});

describe("review amount formatting", () => {
  it.each<[SupportedLocale, string]>([
    ["en-US", "1,234.000000000000000001"],
    ["en-GB", "1,234.000000000000000001"],
    ["de-DE", "1.234,000000000000000001"],
    ["fr-FR", "1\u202f234,000000000000000001"],
    ["es-ES", "1.234,000000000000000001"],
  ])("localizes all exact decimal places in %s", (locale, expected) => {
    expect(formatCollectReviewWei(locale, "1234000000000000000001")).toBe(
      expected
    );
  });

  it.each([
    ["0", "0"],
    ["1", "0.00000001"],
    ["9999999999", "0.00000001"],
    ["10000000000", "0.00000001"],
    ["10000000001", "0.00000002"],
    ["999999999999999999", "1"],
    ["1234567890123456789", "1.2345679"],
    [
      "900719925474099312345678901234567890",
      "900,719,925,474,099,312.34567891",
    ],
  ])(
    "rounds the cap %s wei upward to at most eight decimals",
    (wei, expected) => {
      expect(formatCollectNetworkFeeCap("en-US", wei)).toBe(expected);
    }
  );

  it("keeps the unrounded amount available separately and localizes the rounded cap", () => {
    expect(formatCollectNetworkFeeCap("de-DE", "10000000001")).toBe(
      "0,00000002"
    );
    expect(formatCollectReviewWei("de-DE", "10000000001")).toBe(
      "0,000000010000000001"
    );
  });
});
