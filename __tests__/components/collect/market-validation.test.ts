import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import {
  ApiMarketTransactionApprovalScopeEnum,
  ApiMarketTransactionPurposeEnum,
} from "@/generated/models/ApiMarketTransaction";
import {
  canonicalMarketComponents,
  MARKET_ABI,
  MARKET_CONDUIT,
  MARKET_CONDUIT_KEY,
  MARKET_ORDER_TYPES,
  MARKET_SEAPORT,
  MARKET_ZERO,
  MARKET_ZERO_HASH,
  MARKET_WETH,
  marketTypedData,
  validateMarketOperation,
  validateMarketTransaction,
} from "@/components/collect/market-validation";
import { encodeFunctionData, hashStruct, hashTypedData, parseAbi } from "viem";

const MAKER = "0x1111111111111111111111111111111111111111";
const PAYER = "0x2222222222222222222222222222222222222222";
const RECIPIENT = "0x3333333333333333333333333333333333333333";
const FEE = "0x4444444444444444444444444444444444444444";
const NFT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const NOW = 1_800_000_000_000;

function reseal(operation: ApiMarketOperation) {
  const order = operation.order!;
  const typed = marketTypedData(order.components);
  order.order_hash = hashStruct({
    data: typed.message,
    primaryType: "OrderComponents",
    types: MARKET_ORDER_TYPES,
  });
  order.digest = hashTypedData(typed);
}
function fixture() {
  const request: ApiMarketPrepareRequest = {
    profile_id: "profile",
    wallet: MAKER,
    recipient: MAKER,
    asset_key: `1:${NFT}:1`,
    kind: ApiMarketKind.List,
    quantity: "1",
    currency: MARKET_ZERO,
    amount_wei: "1000",
    expires_at: NOW / 1000 + 3600,
    acknowledge_external_recipient: false,
  };
  const nft = {
    item_type: 3,
    token: NFT,
    identifier_or_criteria: "1",
    start_amount: "1",
    end_amount: "1",
  };
  const payment = {
    item_type: 0,
    token: MARKET_ZERO,
    identifier_or_criteria: "0",
    start_amount: "950",
    end_amount: "950",
    recipient: MAKER,
  };
  const operation: ApiMarketOperation = {
    id: "operation",
    revision: "review-1",
    state: ApiMarketOperationStateEnum.AwaitingSignature,
    profile_id: request.profile_id,
    kind: request.kind,
    wallet: request.wallet,
    recipient: request.recipient,
    recipient_in_profile: true,
    asset_key: request.asset_key,
    quantity: "1",
    currency: MARKET_ZERO,
    total_wei: "1000",
    potential_liability_wei: "0",
    net_wei: "950",
    fees: [{ recipient: FEE, amount_wei: "50" }],
    approval_transactions: [],
    expires_at: NOW + 60_000,
    updated_at: NOW,
    order: {
      protocol_address: MARKET_SEAPORT,
      order_hash: MARKET_ZERO_HASH,
      digest: MARKET_ZERO_HASH,
      components: {
        offerer: MAKER,
        zone: MARKET_ZERO,
        offer: [nft],
        consideration: [
          payment,
          { ...payment, start_amount: "50", end_amount: "50", recipient: FEE },
        ],
        order_type: 0,
        start_time: String(NOW / 1000 - 60),
        end_time: String(request.expires_at),
        zone_hash: MARKET_ZERO_HASH,
        salt: "17",
        conduit_key: MARKET_CONDUIT_KEY,
        counter: "0",
      },
    },
  };
  reseal(operation);
  return { request, operation };
}
function buyFixture() {
  const { request, operation } = fixture();
  request.kind = ApiMarketKind.Buy;
  request.wallet = PAYER;
  request.recipient = RECIPIENT;
  request.acknowledge_external_recipient = true;
  request.order = {
    protocol_address: MARKET_SEAPORT,
    order_hash: operation.order!.order_hash,
  };
  operation.kind = request.kind;
  operation.wallet = PAYER;
  operation.recipient = RECIPIENT;
  operation.recipient_in_profile = false;
  const c = canonicalMarketComponents(operation.order!.components);
  const { counter: _counter, ...parameters } = c;
  const transaction: ApiMarketTransaction = {
    chain_id: 1,
    sender: PAYER,
    to: MARKET_SEAPORT,
    value: "1000",
    purpose: ApiMarketTransactionPurposeEnum.Fulfill,
    data: encodeFunctionData({
      abi: MARKET_ABI,
      functionName: "fulfillAdvancedOrder",
      args: [
        {
          parameters: {
            ...parameters,
            totalOriginalConsiderationItems: BigInt(c.consideration.length),
          },
          numerator: 1n,
          denominator: 1n,
          signature: "0x1234",
          extraData: "0x",
        },
        [],
        MARKET_CONDUIT_KEY,
        RECIPIENT,
      ],
    }),
  };
  return { request, operation, transaction };
}

describe("independent marketplace review validation", () => {
  it("accepts an exact allowlisted listing", () => {
    const f = fixture();
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).not.toThrow();
  });
  it.each(["wallet", "recipient", "currency"] as const)(
    "rejects a changed %s before signing",
    (field) => {
      const f = fixture();
      f.operation[field] = RECIPIENT;
      expect(() =>
        validateMarketOperation(f.operation, f.request, NOW)
      ).toThrow();
    }
  );
  it("rejects a response changing the requested price", () => {
    const f = fixture();
    f.operation.total_wei = "1001";
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("rejects a different NFT even when its hash is internally consistent", () => {
    const f = fixture();
    f.operation.order!.components.offer[0]!.identifier_or_criteria = "2";
    reseal(f.operation);
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("rejects an extra outgoing token", () => {
    const f = fixture();
    f.operation.order!.components.offer.push({
      ...f.operation.order!.components.offer[0]!,
    });
    reseal(f.operation);
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("rejects a substituted royalty recipient with a correct order hash", () => {
    const f = fixture();
    f.operation.order!.components.consideration[1]!.recipient = RECIPIENT;
    reseal(f.operation);
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("rejects an unknown conduit", () => {
    const f = fixture();
    f.operation.order!.components.conduit_key = `0x${"1".repeat(64)}`;
    reseal(f.operation);
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("rejects expired quote timestamps", () => {
    const f = fixture();
    expect(() =>
      validateMarketOperation(f.operation, f.request, f.operation.expires_at)
    ).toThrow();
  });
  it("rejects altered signed expiry", () => {
    const f = fixture();
    f.operation.order!.components.end_time = String(f.request.expires_at! + 1);
    reseal(f.operation);
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("rejects an inconsistent digest", () => {
    const f = fixture();
    f.operation.order!.digest = MARKET_ZERO_HASH;
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it("accepts an exact third-party purchase independent of its payer", () => {
    const f = buyFixture();
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).not.toThrow();
    expect(() =>
      validateMarketTransaction(f.transaction, f.operation, f.request)
    ).not.toThrow();
  });
  it("binds the displayed accepted-offer NFT destination to its signed consideration", () => {
    const f = fixture();
    const c = f.operation.order!.components;
    const nft = c.offer[0]!;
    c.offer = [
      {
        item_type: 1,
        token: MARKET_WETH,
        identifier_or_criteria: "0",
        start_amount: "1000",
        end_amount: "1000",
      },
    ];
    c.consideration = [
      { ...nft, recipient: MAKER },
      {
        item_type: 1,
        token: MARKET_WETH,
        identifier_or_criteria: "0",
        start_amount: "50",
        end_amount: "50",
        recipient: FEE,
      },
    ];
    Object.assign(f.request, {
      kind: ApiMarketKind.Accept,
      wallet: PAYER,
      recipient: PAYER,
      currency: MARKET_WETH,
    });
    Object.assign(f.operation, {
      kind: ApiMarketKind.Accept,
      wallet: PAYER,
      recipient: PAYER,
      currency: MARKET_WETH,
      nft_recipient: MAKER,
    });
    reseal(f.operation);
    f.request.order = {
      protocol_address: MARKET_SEAPORT,
      order_hash: f.operation.order!.order_hash,
    };
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).not.toThrow();
    f.operation.nft_recipient = RECIPIENT;
    expect(() =>
      validateMarketOperation(f.operation, f.request, NOW)
    ).toThrow();
  });
  it.each(["to", "sender"] as const)(
    "rejects a changed transaction %s",
    (field) => {
      const f = buyFixture();
      f.transaction[field] = RECIPIENT;
      expect(() =>
        validateMarketTransaction(f.transaction, f.operation, f.request)
      ).toThrow();
    }
  );
  it("rejects transaction value above the reviewed total", () => {
    const f = buyFixture();
    f.transaction.value = "1001";
    expect(() =>
      validateMarketTransaction(f.transaction, f.operation, f.request)
    ).toThrow();
  });
  it("rejects trailing opaque calldata", () => {
    const f = buyFixture();
    f.transaction.data += "00";
    expect(() =>
      validateMarketTransaction(f.transaction, f.operation, f.request)
    ).toThrow();
  });
  it("rejects collection approval to an arbitrary operator", () => {
    const f = fixture();
    const transaction: ApiMarketTransaction = {
      chain_id: 1,
      sender: MAKER,
      to: NFT,
      value: "0",
      purpose: ApiMarketTransactionPurposeEnum.ApproveNft,
      approval_scope: ApiMarketTransactionApprovalScopeEnum.Collection,
      data: encodeFunctionData({
        abi: parseAbi([
          "function setApprovalForAll(address operator, bool approved)",
        ]),
        functionName: "setApprovalForAll",
        args: [RECIPIENT, true],
      }),
    };
    expect(() =>
      validateMarketTransaction(transaction, f.operation, f.request)
    ).toThrow();
    transaction.data = encodeFunctionData({
      abi: parseAbi([
        "function setApprovalForAll(address operator, bool approved)",
      ]),
      functionName: "setApprovalForAll",
      args: [MARKET_CONDUIT, true],
    });
    expect(() =>
      validateMarketTransaction(transaction, f.operation, f.request)
    ).not.toThrow();
  });
  it.each([
    ["Gradients", "0x0c58ef43ff3032005e472cb5709f8908acb00205"],
    ["Pebbles", "0x45882f9bc325e14fbb298a1df930c43a874b83ae"],
  ] as const)("requires a token-specific approval for %s", (_, contract) => {
    const f = fixture();
    f.request.asset_key = `1:${contract}:1`;
    f.operation.asset_key = f.request.asset_key;
    const transaction: ApiMarketTransaction = {
      chain_id: 1,
      sender: MAKER,
      to: contract,
      value: "0",
      purpose: ApiMarketTransactionPurposeEnum.ApproveNft,
      approval_scope: ApiMarketTransactionApprovalScopeEnum.Token,
      data: encodeFunctionData({
        abi: parseAbi(["function approve(address spender, uint256 amount)"]),
        functionName: "approve",
        args: [MARKET_CONDUIT, 1n],
      }),
    };
    expect(() =>
      validateMarketTransaction(transaction, f.operation, f.request)
    ).not.toThrow();
    transaction.approval_scope =
      ApiMarketTransactionApprovalScopeEnum.Collection;
    transaction.data = encodeFunctionData({
      abi: parseAbi([
        "function setApprovalForAll(address operator, bool approved)",
      ]),
      functionName: "setApprovalForAll",
      args: [MARKET_CONDUIT, true],
    });
    expect(() =>
      validateMarketTransaction(transaction, f.operation, f.request)
    ).toThrow("MARKET_REVIEW_MISMATCH");
  });
});
