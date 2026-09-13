import { collectPurchaseReview } from "@/components/collect/collect-purchase-review";
import type { CollectReviewFact } from "@/components/collect/collect.types";
import {
  MARKET_CONDUIT,
  MARKET_SEAPORT,
  MARKET_WETH,
  MARKET_ZERO,
  MARKET_ZERO_HASH,
} from "@/components/collect/market-validation";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  type ApiMarketOperation,
  ApiMarketOperationStateEnum,
} from "@/generated/models/ApiMarketOperation";
import {
  type ApiMarketTransaction,
  ApiMarketTransactionApprovalScopeEnum,
  ApiMarketTransactionPurposeEnum,
} from "@/generated/models/ApiMarketTransaction";
import { formatDate } from "@/i18n/format";
import { getAddress } from "viem";

const PAYER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const CUSTODY = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const FRIEND = "0xcccccccccccccccccccccccccccccccccccccccc";
const FEE = "0xdddddddddddddddddddddddddddddddddddddddd";
const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const PROFILE_ID = "collecting-profile";
const PRICE = "652900000000000000";
const GAS = "25104378893752";
const LISTING_END_SECONDS = "1900000000";

function transaction(
  overrides: Partial<ApiMarketTransaction> = {}
): ApiMarketTransaction {
  return {
    chain_id: 1,
    to: MARKET_SEAPORT,
    value: PRICE,
    data: "0x",
    purpose: ApiMarketTransactionPurposeEnum.Fulfill,
    sender: PAYER,
    gas_reserve_wei: GAS,
    ...overrides,
  };
}

function operation(
  overrides: Partial<ApiMarketOperation> = {}
): ApiMarketOperation {
  return {
    id: "purchase-review",
    revision: "revision-3",
    state: ApiMarketOperationStateEnum.Review,
    profile_id: PROFILE_ID,
    kind: ApiMarketKind.Buy,
    wallet: PAYER,
    recipient: CUSTODY,
    recipient_in_profile: true,
    asset_key: `1:${MEMES}:546`,
    quantity: "3",
    currency: MARKET_ZERO,
    total_wei: PRICE,
    net_wei: "646371000000000000",
    fees: [{ recipient: FEE, amount_wei: "6529000000000000" }],
    approval_transactions: [],
    transaction: transaction(),
    order: {
      protocol_address: MARKET_SEAPORT,
      order_hash: `0x${"1".repeat(64)}`,
      digest: `0x${"2".repeat(64)}`,
      components: {
        offerer: FRIEND,
        zone: MARKET_ZERO,
        offer: [],
        consideration: [],
        order_type: 0,
        start_time: "1800000000",
        end_time: LISTING_END_SECONDS,
        zone_hash: MARKET_ZERO_HASH,
        salt: "1",
        conduit_key: MARKET_ZERO_HASH,
        counter: "0",
      },
    },
    expires_at: 1_800_000_060_000,
    updated_at: 1_800_000_000_000,
    potential_liability_wei: "0",
    ...overrides,
  };
}

function profile(overrides: Partial<ApiIdentity> = {}): ApiIdentity {
  return Object.assign(new ApiIdentity(), {
    id: PROFILE_ID,
    primary_wallet: PAYER,
    display: "collector",
    wallets: [
      { wallet: getAddress(PAYER), display: "payer.eth", tdh: 0 },
      { wallet: getAddress(CUSTODY), display: "custody.eth", tdh: 0 },
    ],
    ...overrides,
  });
}

function review(
  value: ApiMarketOperation = operation(),
  currentProfile: ApiIdentity | null = profile(),
  technicalFacts: readonly CollectReviewFact[] = []
) {
  return collectPurchaseReview(value, "en-US", currentProfile, technicalFacts);
}

it("keeps the exact gross price for all selected copies and includes fees once", () => {
  expect(review()).toMatchObject({
    amounts: {
      purchaseWei: PRICE,
      feesWei: "6529000000000000",
      networkFeeCapWei: GAS,
      maximumTotalWei: "652925104378893752",
    },
    currency: "ETH",
    quantity: "3",
    netWei: "646371000000000000",
    fees: [{ amountWei: "6529000000000000", recipient: FEE }],
  });
});

it.each([
  [MEMES, "546", "The Memes #546"],
  ["0x0c58ef43ff3032005e472cb5709f8908acb00205", "0", "Gradients #0"],
  [
    "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
    "10000000000",
    "Pebbles #10000000000",
  ],
])(
  "preserves %s token %s as the artwork identity",
  (contract, tokenId, label) => {
    const result = review(operation({ asset_key: `1:${contract}:${tokenId}` }));
    expect(result?.artworkLabel).toBe(label);
    expect(result).toMatchObject({
      chainId: 1,
      nftContract: getAddress(contract),
      exchangeContract: getAddress(MARKET_SEAPORT),
    });
    expect(result?.contractFacts).toEqual(
      expect.arrayContaining([{ label: "Token ID", value: tokenId }])
    );
    expect(result?.contractFacts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "NFT contract" }),
      ])
    );
    expect(result?.contractFacts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Exchange contract" }),
      ])
    );
  }
);

it("matches named profile wallets case-insensitively without replacing operation addresses", () => {
  const value = operation({ wallet: getAddress(PAYER), recipient: CUSTODY });
  expect(review(value)).toMatchObject({
    payerAddress: getAddress(PAYER),
    payerName: "payer.eth",
    recipientAddress: CUSTODY,
    recipientName: "custody.eth",
    recipientInProfile: true,
  });
});

it.each([profile({ id: "other-profile" }), null])(
  "does not borrow names from a switched or missing profile",
  (currentProfile) => {
    expect(review(operation(), currentProfile)).toMatchObject({
      payerAddress: PAYER,
      payerName: undefined,
      recipientAddress: CUSTODY,
      recipientName: undefined,
    });
  }
);

it("uses the authoritative third-party NFT destination and keeps the payer distinct", () => {
  expect(
    review(
      operation({
        recipient: PAYER,
        nft_recipient: FRIEND,
        recipient_in_profile: false,
      })
    )
  ).toMatchObject({
    payerAddress: PAYER,
    payerName: "payer.eth",
    recipientAddress: FRIEND,
    recipientName: undefined,
    recipientInProfile: false,
  });
});

it("uses the primary wallet display when that profile has no wallet list", () => {
  expect(
    review(operation({ recipient: PAYER }), profile({ wallets: [] }))
  ).toMatchObject({
    payerName: "collector",
    recipientAddress: PAYER,
    recipientName: "collector",
  });
});

it("does not repeat an address-valued wallet display as a name", () => {
  expect(
    review(
      operation(),
      profile({
        wallets: [{ wallet: PAYER, display: getAddress(PAYER), tdh: 0 }],
      })
    )?.payerName
  ).toBeUndefined();
});

it("keeps each approval scope, contract and exact fee cap while preserving unknown caps", () => {
  const unknown = transaction({
    to: MARKET_WETH,
    value: "0",
    purpose: ApiMarketTransactionPurposeEnum.ApproveCurrency,
  });
  delete unknown.gas_reserve_wei;
  const result = review(
    operation({
      currency: MARKET_WETH,
      transaction: transaction({ value: "0" }),
      approval_transactions: [
        transaction({
          to: MARKET_WETH,
          value: "0",
          purpose: ApiMarketTransactionPurposeEnum.ApproveCurrency,
          approval_scope: ApiMarketTransactionApprovalScopeEnum.CurrencyAmount,
          gas_reserve_wei: "123456789012345678",
        }),
        unknown,
      ],
    })
  );
  expect(result?.approvalFeeCaps).toEqual([
    { label: "Included approval fee cap 1", amountWei: "123456789012345678" },
    { label: "Included approval fee cap 2", amountWei: null },
  ]);
  expect(result?.contractFacts).toEqual(
    expect.arrayContaining([
      {
        label: "Token approval 1",
        value: `CURRENCY_AMOUNT · ${getAddress(MARKET_WETH)}`,
      },
      {
        label: "Token approval 2",
        value: `APPROVE_CURRENCY · ${getAddress(MARKET_WETH)}`,
      },
    ])
  );
  expect(result).toMatchObject({
    currency: "WETH",
    amounts: {
      purchaseWei: PRICE,
      networkFeeCapWei: null,
      maximumTotalWei: null,
    },
  });
});

it("retains an explicitly zero approval cap rather than treating it as unknown", () => {
  const result = review(
    operation({
      approval_transactions: [
        transaction({ value: "0", gas_reserve_wei: "0" }),
      ],
    })
  );
  expect(result?.approvalFeeCaps[0]?.amountWei).toBe("0");
  expect(result?.amounts.networkFeeCapWei).toBe(GAS);
});

it("preserves approval spender, recovered transaction and revision without duplicate canonical facts", () => {
  const retained = [
    { label: "Approved operator", value: MARKET_CONDUIT },
    { label: "Transaction hash", value: `0x${"3".repeat(64)}` },
    { label: "Review revision", value: "revision-3" },
  ];
  const result = review(operation(), profile(), [
    { label: "Artwork", value: `1:${MEMES}:546` },
    { label: "Exchange contract", value: MARKET_SEAPORT },
    { label: "Network", value: "Ethereum · 1" },
    ...retained,
  ]);
  expect(result?.contractFacts).toEqual(expect.arrayContaining(retained));
  expect(
    result?.contractFacts.filter((fact) => fact.label === "Network")
  ).toHaveLength(1);
  expect(
    result?.contractFacts.filter((fact) => fact.label === "Exchange contract")
  ).toEqual([]);
  expect(result?.exchangeContract).toBe(getAddress(MARKET_SEAPORT));
  expect(
    result?.contractFacts.some((fact) => fact.value === `1:${MEMES}:546`)
  ).toBe(false);
});

it("derives listing expiry from order seconds independently of the review refresh deadline", () => {
  const value = operation();
  const expectedListing = {
    label: "Listing expires",
    value: formatDate("en-US", 1_900_000_000_000, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
  expect(review(value)?.contractFacts).toContainEqual(expectedListing);
  expect(
    review({ ...value, expires_at: 1_700_000_000_000 })?.contractFacts
  ).toContainEqual(expectedListing);
});

it("does not invent a listing expiry from a review deadline when no order is available", () => {
  const value = operation();
  delete value.order;
  expect(
    review(value)?.contractFacts.some(
      (fact) => fact.label === "Listing expires"
    )
  ).toBe(false);
});

it.each([
  ApiMarketKind.Accept,
  ApiMarketKind.Offer,
  ApiMarketKind.List,
  ApiMarketKind.Cancel,
])("does not present %s as an immediate purchase", (kind) => {
  expect(review(operation({ kind }))).toBeUndefined();
});
