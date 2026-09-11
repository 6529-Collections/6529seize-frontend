import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketTransactionPurposeEnum as Purpose,
  ApiMarketTransactionApprovalScopeEnum as Scope,
} from "@/generated/models/ApiMarketTransaction";
import type { ApiMarketComponents } from "@/generated/models/ApiMarketComponents";
import type { ApiMarketOfferItem } from "@/generated/models/ApiMarketOfferItem";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import {
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
  hashStruct,
  hashTypedData,
  isHex,
  parseAbi,
  type Hex,
} from "viem";

// Independent browser allowlist. Never obtain signing contracts or EIP-712 types from a response.
export const MARKET_SEAPORT = "0x0000000000000068f116a894984e2db1123eb395";
export const MARKET_WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const MARKET_ZERO = "0x0000000000000000000000000000000000000000";
export const MARKET_ZERO_HASH = `0x${"0".repeat(64)}`;
export const MARKET_CONDUIT = "0x1e0049783f008a0085193e00003d00cd54003c71";
export const MARKET_CONDUIT_KEY =
  "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
const MARKET_ZONE = "0x000056f7000000ece9003ca63978907a00ffd100";
const NFT_TYPES: Readonly<Record<string, number>> = {
  "0x33fd426905f149f8376e227d0c9d3340aad17af1": 3,
  "0x0c58ef43ff3032005e472cb5709f8908acb00205": 2,
  "0x45882f9bc325e14fbb298a1df930c43a874b83ae": 2,
};
export const MARKET_ORDER_TYPES = {
  OrderComponents: [
    { name: "offerer", type: "address" },
    { name: "zone", type: "address" },
    { name: "offer", type: "OfferItem[]" },
    { name: "consideration", type: "ConsiderationItem[]" },
    { name: "orderType", type: "uint8" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "zoneHash", type: "bytes32" },
    { name: "salt", type: "uint256" },
    { name: "conduitKey", type: "bytes32" },
    { name: "counter", type: "uint256" },
  ],
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
    { name: "recipient", type: "address" },
  ],
} as const;
export const MARKET_ABI = parseAbi([
  "struct OfferItem { uint8 itemType; address token; uint256 identifierOrCriteria; uint256 startAmount; uint256 endAmount; }",
  "struct ConsiderationItem { uint8 itemType; address token; uint256 identifierOrCriteria; uint256 startAmount; uint256 endAmount; address recipient; }",
  "struct OrderComponents { address offerer; address zone; OfferItem[] offer; ConsiderationItem[] consideration; uint8 orderType; uint256 startTime; uint256 endTime; bytes32 zoneHash; uint256 salt; bytes32 conduitKey; uint256 counter; }",
  "struct OrderParameters { address offerer; address zone; OfferItem[] offer; ConsiderationItem[] consideration; uint8 orderType; uint256 startTime; uint256 endTime; bytes32 zoneHash; uint256 salt; bytes32 conduitKey; uint256 totalOriginalConsiderationItems; }",
  "struct AdvancedOrder { OrderParameters parameters; uint120 numerator; uint120 denominator; bytes signature; bytes extraData; }",
  "struct CriteriaResolver { uint256 orderIndex; uint8 side; uint256 index; uint256 identifier; bytes32[] criteriaProof; }",
  "function fulfillAdvancedOrder(AdvancedOrder advancedOrder, CriteriaResolver[] criteriaResolvers, bytes32 fulfillerConduitKey, address recipient) payable returns (bool fulfilled)",
  "function cancel(OrderComponents[] orders) returns (bool cancelled)",
]);
const APPROVAL_ABI = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function setApprovalForAll(address operator, bool approved)",
]);
function assert(value: unknown): asserts value {
  if (!Boolean(value)) throw new Error("MARKET_REVIEW_MISMATCH");
}
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
function uint(value: string): bigint {
  assert(/^(0|[1-9][0-9]{0,77})$/.test(value));
  const result = BigInt(value);
  assert(result < 2n ** 256n);
  return result;
}
function bytes32(value: string): Hex {
  assert(isHex(value, { strict: true }) && value.length === 66);
  return value;
}
function item(input: ApiMarketOfferItem) {
  return {
    itemType: input.item_type,
    token: getAddress(input.token),
    identifierOrCriteria: uint(input.identifier_or_criteria),
    startAmount: uint(input.start_amount),
    endAmount: uint(input.end_amount),
  };
}
export function canonicalMarketComponents(input: ApiMarketComponents) {
  return {
    offerer: getAddress(input.offerer),
    zone: getAddress(input.zone),
    offer: input.offer.map(item),
    consideration: input.consideration.map((entry) => ({
      ...item(entry),
      recipient: getAddress(entry.recipient),
    })),
    orderType: input.order_type,
    startTime: uint(input.start_time),
    endTime: uint(input.end_time),
    zoneHash: bytes32(input.zone_hash),
    salt: uint(input.salt),
    conduitKey: bytes32(input.conduit_key),
    counter: uint(input.counter),
  };
}
export function marketTypedData(input: ApiMarketComponents) {
  return {
    domain: {
      name: "Seaport",
      version: "1.6",
      chainId: 1,
      verifyingContract: MARKET_SEAPORT,
    },
    types: MARKET_ORDER_TYPES,
    primaryType: "OrderComponents",
    message: canonicalMarketComponents(input),
  } as const;
}
function validateMarketIntent(
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest,
  now = Date.now()
) {
  assert(
    operation.profile_id === expected.profile_id &&
      operation.kind === expected.kind &&
      same(operation.wallet, expected.wallet) &&
      same(operation.recipient, expected.recipient)
  );
  assert(
    operation.asset_key === expected.asset_key &&
      operation.quantity === expected.quantity &&
      same(operation.currency, expected.currency)
  );
  assert(
    operation.expires_at > now && Number.isSafeInteger(operation.expires_at)
  );
  assert(uint(operation.total_wei) === uint(expected.amount_wei));
  const [chain, contract, tokenId] = expected.asset_key.split(":");
  assert(
    chain === "1" &&
      contract &&
      tokenId &&
      NFT_TYPES[contract.toLowerCase()] !== undefined
  );
  assert(
    uint(expected.quantity) > 0n &&
      (NFT_TYPES[contract.toLowerCase()] !== 2 || expected.quantity === "1")
  );
  assert([MARKET_ZERO, MARKET_WETH].includes(expected.currency.toLowerCase()));
  assert(
    !same(expected.wallet, MARKET_ZERO) &&
      !same(expected.recipient, MARKET_ZERO)
  );
  if (
    expected.kind === ApiMarketKind.Offer ||
    expected.kind === ApiMarketKind.Accept
  )
    assert(same(expected.currency, MARKET_WETH));
  if (
    expected.kind === ApiMarketKind.List ||
    expected.kind === ApiMarketKind.Offer ||
    expected.kind === ApiMarketKind.Accept ||
    expected.kind === ApiMarketKind.Cancel
  )
    assert(same(expected.wallet, expected.recipient));
  assert(operation.fees.length <= 15);
  const feeTotal = operation.fees.reduce((sum, fee) => {
    getAddress(fee.recipient);
    return sum + uint(fee.amount_wei);
  }, 0n);
  if (expected.kind !== ApiMarketKind.Cancel)
    assert(
      uint(operation.net_wei) > 0n &&
        uint(operation.net_wei) + feeTotal === uint(operation.total_wei)
    );
  return { contract, tokenId };
}

function validateOrderHash(
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest
) {
  const order = operation.order;
  assert(order && same(order.protocol_address, MARKET_SEAPORT));
  const typed = marketTypedData(order.components);
  const c = typed.message;
  assert(
    same(
      hashStruct({
        data: c,
        primaryType: "OrderComponents",
        types: MARKET_ORDER_TYPES,
      }),
      order.order_hash
    )
  );
  assert(same(hashTypedData(typed), order.digest));
  if (expected.order)
    assert(
      same(expected.order.protocol_address, MARKET_SEAPORT) &&
        same(order.order_hash, expected.order.order_hash)
    );
  return c;
}

type Components = ReturnType<typeof canonicalMarketComponents>;
function validateOrderStructure(
  c: Components,
  expected: ApiMarketPrepareRequest,
  now: number
) {
  assert(
    c.offer.length === 1 &&
      c.consideration.length >= 1 &&
      c.consideration.length <= 16
  );
  assert([0, 1, 2, 3].includes(c.orderType));
  assert(
    same(c.zone, c.orderType >= 2 ? MARKET_ZONE : MARKET_ZERO) &&
      same(c.zoneHash, MARKET_ZERO_HASH)
  );
  assert(
    [MARKET_ZERO_HASH, MARKET_CONDUIT_KEY].includes(c.conduitKey.toLowerCase())
  );
  assert(
    c.startTime < c.endTime &&
      c.startTime <= BigInt(Math.floor(now / 1000)) &&
      c.endTime > BigInt(Math.floor(now / 1000))
  );
  const creating =
    expected.kind === ApiMarketKind.List ||
    expected.kind === ApiMarketKind.Offer;
  if (creating)
    assert(
      same(c.offerer, expected.wallet) &&
        expected.expires_at !== undefined &&
        c.endTime === BigInt(expected.expires_at)
    );
  const listing =
    expected.kind === ApiMarketKind.Buy || expected.kind === ApiMarketKind.List;
  return { creating, listing };
}

function validateTokenFlow(
  c: Components,
  expected: ApiMarketPrepareRequest,
  contract: string,
  tokenId: string,
  {
    creating,
    listing,
  }: { readonly creating: boolean; readonly listing: boolean }
) {
  const nft = listing ? c.offer[0] : c.consideration[0];
  assert(
    nft &&
      nft.itemType === NFT_TYPES[contract.toLowerCase()] &&
      same(nft.token, contract) &&
      nft.identifierOrCriteria === uint(tokenId)
  );
  const quantity = uint(expected.quantity);
  assert(
    quantity <= nft.startAmount &&
      (quantity === nft.startAmount || (!creating && c.orderType % 2 === 1))
  );
  for (const entry of [...c.offer, ...c.consideration])
    assert(
      entry.startAmount > 0n &&
        entry.startAmount === entry.endAmount &&
        (entry.startAmount * quantity) % nft.startAmount === 0n
    );
  const scale = (amount: bigint) => (amount * quantity) / nft.startAmount;
  return scale;
}

function validatePaymentFlow(
  c: Components,
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest,
  listing: boolean,
  scale: (amount: bigint) => bigint
) {
  const payments = listing
    ? c.consideration
    : [c.offer[0], ...c.consideration.slice(1)];
  for (const payment of payments)
    assert(
      payment?.itemType === (same(expected.currency, MARKET_ZERO) ? 0 : 1) &&
        same(payment.token, expected.currency) &&
        payment.identifierOrCriteria === 0n
    );
  const firstConsideration = c.consideration[0];
  assert(firstConsideration);
  if (listing)
    assert(
      same(firstConsideration.recipient, c.offerer) &&
        scale(firstConsideration.startAmount) === uint(operation.net_wei)
    );
  else {
    assert(scale(c.offer[0]!.startAmount) === uint(operation.total_wei));
    if (expected.kind === ApiMarketKind.Accept)
      assert(
        operation.nft_recipient &&
          same(firstConsideration.recipient, operation.nft_recipient)
      );
    if (expected.kind === ApiMarketKind.Offer)
      assert(same(firstConsideration.recipient, expected.recipient));
  }
  if (expected.kind === ApiMarketKind.Buy && operation.nft_recipient)
    assert(same(operation.nft_recipient, expected.recipient));
  const actualFees = c.consideration.slice(1);
  assert(actualFees.length === operation.fees.length);
  actualFees.forEach((fee, index) => {
    const expectedFee = operation.fees[index];
    assert(
      expectedFee &&
        same(fee.recipient, expectedFee.recipient) &&
        scale(fee.startAmount) === uint(expectedFee.amount_wei)
    );
  });
}

export function validateMarketOperation(
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest,
  now = Date.now()
): void {
  const { contract, tokenId } = validateMarketIntent(operation, expected, now);
  const c = validateOrderHash(operation, expected);
  if (expected.kind === ApiMarketKind.Cancel) {
    assert(same(c.offerer, expected.wallet));
    return;
  }
  const { creating, listing } = validateOrderStructure(c, expected, now);
  const scale = validateTokenFlow(c, expected, contract, tokenId, {
    creating,
    listing,
  });
  validatePaymentFlow(c, operation, expected, listing, scale);
}

function validateApprovalTransaction(
  transaction: ApiMarketTransaction,
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest,
  contract: string,
  tokenId: string
): void {
  const order = operation.order;
  assert(order);
  assert(isHex(transaction.data, { strict: true }));
  assert(uint(transaction.value) === 0n);
  const approval = decodeFunctionData({
    abi: APPROVAL_ABI,
    data: transaction.data,
  });
  const spender = approval.args[0];
  const usesDirectSpender =
    (expected.kind === ApiMarketKind.List ||
      expected.kind === ApiMarketKind.Offer) &&
    same(order.components.conduit_key, MARKET_ZERO_HASH);
  const expectedSpender = usesDirectSpender ? MARKET_SEAPORT : MARKET_CONDUIT;
  assert(same(spender, expectedSpender));
  if (transaction.purpose === Purpose.ApproveCurrency) {
    assert(
      ["BUY", "OFFER", "ACCEPT"].includes(expected.kind) &&
        same(expected.currency, MARKET_WETH) &&
        same(transaction.to, MARKET_WETH)
    );
    const amount =
      expected.kind === ApiMarketKind.Accept
        ? operation.fees.reduce((sum, fee) => sum + uint(fee.amount_wei), 0n)
        : uint(operation.total_wei);
    assert(
      approval.functionName === "approve" &&
        approval.args[1] === amount &&
        amount > 0n &&
        transaction.approval_scope === Scope.CurrencyAmount
    );
  } else {
    assert(
      ["LIST", "ACCEPT"].includes(expected.kind) &&
        same(transaction.to, contract)
    );
    if (approval.functionName === "approve")
      assert(
        NFT_TYPES[contract.toLowerCase()] === 2 &&
          approval.args[1] === uint(tokenId) &&
          transaction.approval_scope === Scope.Token
      );
    else
      assert(
        NFT_TYPES[contract.toLowerCase()] === 3 &&
          approval.args[1] &&
          transaction.approval_scope === Scope.Collection
      );
  }
  assert(
    same(
      encodeFunctionData({ abi: APPROVAL_ABI, ...approval }),
      transaction.data
    )
  );
}

export function validateMarketTransaction(
  transaction: ApiMarketTransaction,
  operation: ApiMarketOperation,
  expected: ApiMarketPrepareRequest
): void {
  assert(
    transaction.chain_id === 1 && same(transaction.sender, expected.wallet)
  );
  assert(isHex(transaction.data, { strict: true }));
  const [chain, contract, tokenId] = expected.asset_key.split(":");
  assert(chain === "1" && contract && tokenId);
  const order = operation.order;
  assert(order);
  if (
    transaction.purpose === Purpose.ApproveNft ||
    transaction.purpose === Purpose.ApproveCurrency
  ) {
    validateApprovalTransaction(
      transaction,
      operation,
      expected,
      contract,
      tokenId
    );
    return;
  }
  assert(same(transaction.to, MARKET_SEAPORT));
  const decoded = decodeFunctionData({
    abi: MARKET_ABI,
    data: transaction.data,
  });
  assert(
    same(encodeFunctionData({ abi: MARKET_ABI, ...decoded }), transaction.data)
  );
  const c = canonicalMarketComponents(order.components);
  if (transaction.purpose === Purpose.Cancel) {
    assert(
      expected.kind === ApiMarketKind.Cancel &&
        uint(transaction.value) === 0n &&
        decoded.functionName === "cancel" &&
        decoded.args[0].length === 1
    );
    assert(
      same(
        hashStruct({
          data: decoded.args[0][0]!,
          primaryType: "OrderComponents",
          types: MARKET_ORDER_TYPES,
        }),
        order.order_hash
      )
    );
    return;
  }
  assert(
    transaction.purpose.toString() === "FULFILL" &&
      ["BUY", "ACCEPT"].includes(expected.kind) &&
      decoded.functionName === "fulfillAdvancedOrder"
  );
  const [advanced, criteria, conduit, recipient] = decoded.args;
  assert(
    criteria.length === 0 &&
      same(conduit, MARKET_CONDUIT_KEY) &&
      same(recipient, expected.recipient)
  );
  assert(
    advanced.parameters.totalOriginalConsiderationItems ===
      BigInt(c.consideration.length)
  );
  assert(
    same(
      hashStruct({
        data: { ...advanced.parameters, counter: c.counter },
        primaryType: "OrderComponents",
        types: MARKET_ORDER_TYPES,
      }),
      order.order_hash
    )
  );
  const original =
    expected.kind === ApiMarketKind.Buy
      ? c.offer[0]?.startAmount
      : c.consideration[0]?.startAmount;
  assert(
    original !== undefined &&
      original > 0n &&
      advanced.numerator > 0n &&
      advanced.denominator > 0n &&
      advanced.numerator * original ===
        uint(expected.quantity) * advanced.denominator
  );
  assert(
    c.orderType >= 2 ? advanced.extraData !== "0x" : advanced.extraData === "0x"
  );
  assert(
    uint(transaction.value) ===
      (expected.kind === ApiMarketKind.Buy &&
      same(expected.currency, MARKET_ZERO)
        ? uint(operation.total_wei)
        : 0n)
  );
}
