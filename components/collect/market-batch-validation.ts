import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import type { ApiMarketBatchItem } from "@/generated/models/ApiMarketBatchItem";
import type { ApiMarketBatchItemRequest } from "@/generated/models/ApiMarketBatchItemRequest";
import {
  decodeFunctionData,
  encodeFunctionData,
  getAddress,
  hashStruct,
  hashTypedData,
  isHex,
  parseAbi,
} from "viem";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
  MARKET_ZERO_HASH,
  MARKET_CONDUIT_KEY,
  MARKET_ORDER_TYPES,
  marketTypedData,
} from "./market-validation";
import { validateBatchFlow } from "./market-batch-flow";

// Independent browser limits and contract allowlist, never supplied by an API response.
export const MARKET_BATCH_LIMITS = {
  orders: 128,
  allocations: 256,
  calldata: 1_048_576,
} as const;
const ZONE = "0x000056f7000000ece9003ca63978907a00ffd100";
const NFT_TYPES: Readonly<Record<string, number>> = {
  "0x33fd426905f149f8376e227d0c9d3340aad17af1": 3,
  "0x0c58ef43ff3032005e472cb5709f8908acb00205": 2,
  "0x45882f9bc325e14fbb298a1df930c43a874b83ae": 2,
};
export const MARKET_BATCH_ABI = parseAbi([
  "struct OfferItem { uint8 itemType; address token; uint256 identifierOrCriteria; uint256 startAmount; uint256 endAmount; }",
  "struct ConsiderationItem { uint8 itemType; address token; uint256 identifierOrCriteria; uint256 startAmount; uint256 endAmount; address recipient; }",
  "struct OrderParameters { address offerer; address zone; OfferItem[] offer; ConsiderationItem[] consideration; uint8 orderType; uint256 startTime; uint256 endTime; bytes32 zoneHash; uint256 salt; bytes32 conduitKey; uint256 totalOriginalConsiderationItems; }",
  "struct AdvancedOrder { OrderParameters parameters; uint120 numerator; uint120 denominator; bytes signature; bytes extraData; }",
  "struct CriteriaResolver { uint256 orderIndex; uint8 side; uint256 index; uint256 identifier; bytes32[] criteriaProof; }",
  "struct Component { uint256 orderIndex; uint256 itemIndex; }",
  "struct Fulfillment { Component[] offerComponents; Component[] considerationComponents; }",
  "function matchAdvancedOrders(AdvancedOrder[] orders, CriteriaResolver[] criteriaResolvers, Fulfillment[] fulfillments, address recipient) payable",
]);

function assertBatch(value: unknown): asserts value {
  if (!Boolean(value)) throw new Error("MARKET_REVIEW_MISMATCH");
}
/** Generated enum types cannot validate JSON. Compare runtime values without coercion. */
export function marketBatchLiteral(value: unknown, expected: string): boolean {
  return value === expected;
}
function batchUint(value: unknown): bigint {
  assertBatch(
    typeof value === "string" && /^(0|[1-9][0-9]{0,77})$/.test(value)
  );
  const number = BigInt(value);
  assertBatch(number < 2n ** 256n);
  return number;
}
function batchSame(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}
function address(value: string): string {
  const checked = getAddress(value);
  assertBatch(!batchSame(checked, MARKET_ZERO));
  return checked.toLowerCase();
}
function asset(key: string) {
  const [chain, contract, id, extra] = key.split(":");
  assertBatch(chain === "1" && contract && id && extra === undefined);
  const type = NFT_TYPES[contract];
  assertBatch(type !== undefined && address(contract) === contract);
  const identifier = batchUint(id);
  return { contract, identifier, type };
}
function orderIdentity(item: ApiMarketBatchItemRequest): string {
  assertBatch(batchSame(item.order.protocol_address, MARKET_SEAPORT));
  assertBatch(
    isHex(item.order.order_hash, { strict: true }) &&
      item.order.order_hash.length === 66
  );
  return item.order.order_hash.toLowerCase();
}

/** Validate locally selected intent, including consent bound to current profile membership. */
export function validateMarketBatchRequest(
  request: ApiMarketBatchPrepareRequest,
  profileWallets: readonly string[]
): void {
  assertBatch(
    marketBatchLiteral(request.kind, "BUY_BATCH") &&
      marketBatchLiteral(request.execution_policy, "ALL_OR_REVERT")
  );
  assertBatch(
    typeof request.profile_id === "string" && request.profile_id.length > 0
  );
  assertBatch(batchSame(request.currency, MARKET_ZERO));
  const members = new Set(profileWallets.map(address));
  assertBatch(members.has(address(request.wallet)));
  assertBatch(
    request.items.length > 0 &&
      request.items.length <= MARKET_BATCH_LIMITS.orders
  );
  const hashes = new Set<string>(),
    tokens = new Set<string>();
  let total = 0n,
    allocationCount = 0;
  for (const item of request.items) {
    const nft = asset(item.asset_key);
    const hash = orderIdentity(item);
    assertBatch(!hashes.has(hash));
    hashes.add(hash);
    const quantity = batchUint(item.quantity),
      amount = batchUint(item.amount_wei);
    assertBatch(quantity > 0n && amount > 0n);
    if (nft.type === 2) {
      assertBatch(quantity === 1n && !tokens.has(item.asset_key));
      tokens.add(item.asset_key);
    }
    total += amount;
    assertBatch(item.allocations.length > 0);
    const recipients = new Set<string>();
    let copies = 0n;
    for (const allocation of item.allocations) {
      const recipient = address(allocation.recipient);
      assertBatch(!recipients.has(recipient));
      recipients.add(recipient);
      assertBatch(
        typeof allocation.acknowledge_external_recipient === "boolean"
      );
      assertBatch(
        members.has(recipient) || allocation.acknowledge_external_recipient
      );
      const count = batchUint(allocation.quantity);
      assertBatch(count > 0n);
      copies += count;
      allocationCount++;
    }
    assertBatch(copies === quantity);
  }
  assertBatch(
    allocationCount <= MARKET_BATCH_LIMITS.allocations &&
      total === batchUint(request.amount_wei)
  );
}

function validateItem(
  actual: ApiMarketBatchItem,
  expected: ApiMarketBatchItemRequest,
  wallets: readonly string[],
  now: bigint
) {
  assertBatch(
    actual.asset_key === expected.asset_key &&
      actual.quantity === expected.quantity &&
      actual.amount_wei === expected.amount_wei
  );
  assertBatch(orderIdentity(actual) === orderIdentity(expected));
  assertBatch(actual.allocations.length === expected.allocations.length);
  actual.allocations.forEach((allocation, index) => {
    const selected = expected.allocations[index];
    assertBatch(
      selected &&
        batchSame(allocation.recipient, selected.recipient) &&
        allocation.quantity === selected.quantity
    );
    assertBatch(
      allocation.acknowledge_external_recipient ===
        selected.acknowledge_external_recipient
    );
    const member = wallets.some((wallet) =>
      batchSame(wallet, selected.recipient)
    );
    assertBatch(allocation.recipient_in_profile === member);
  });
  const reviewed = actual.reviewed_order;
  assertBatch(reviewed && batchSame(reviewed.protocol_address, MARKET_SEAPORT));
  const typed = marketTypedData(reviewed.components),
    c = typed.message;
  assertBatch(batchSame(reviewed.order_hash, expected.order.order_hash));
  assertBatch(
    batchSame(
      hashStruct({
        data: c,
        primaryType: "OrderComponents",
        types: MARKET_ORDER_TYPES,
      }),
      reviewed.order_hash
    )
  );
  assertBatch(batchSame(hashTypedData(typed), reviewed.digest));
  assertBatch(
    !wallets.some((wallet) => batchSame(wallet, c.offerer)) &&
      !batchSame(c.offerer, MARKET_ZERO)
  );
  assertBatch(
    c.offer.length === 1 &&
      c.consideration.length > 0 &&
      c.consideration.length <= 16
  );
  assertBatch([0, 1, 2, 3].includes(c.orderType));
  assertBatch(
    batchSame(c.zone, c.orderType >= 2 ? ZONE : MARKET_ZERO) &&
      batchSame(c.zoneHash, MARKET_ZERO_HASH)
  );
  assertBatch(
    [MARKET_ZERO_HASH, MARKET_CONDUIT_KEY].includes(c.conduitKey.toLowerCase())
  );
  assertBatch(c.startTime <= now && c.endTime > now && c.startTime < c.endTime);
  const nft = asset(expected.asset_key),
    offered = c.offer[0];
  assertBatch(
    offered?.itemType === nft.type &&
      batchSame(offered.token, nft.contract) &&
      offered.identifierOrCriteria === nft.identifier
  );
  const quantity = batchUint(expected.quantity);
  assertBatch(
    quantity <= offered.startAmount &&
      (quantity === offered.startAmount || c.orderType % 2 === 1)
  );
  // Current fresh SignedZone proof covers restricted editions whose original quantity is one.
  assertBatch(c.orderType < 2 || nft.type !== 3 || offered.startAmount === 1n);
  const scale = (value: bigint) => (value * quantity) / offered.startAmount;
  for (const entry of [...c.offer, ...c.consideration]) {
    assertBatch(
      entry.startAmount > 0n && entry.startAmount === entry.endAmount
    );
    assertBatch((entry.startAmount * quantity) % offered.startAmount === 0n);
  }
  let total = 0n;
  for (const payment of c.consideration) {
    assertBatch(
      payment.itemType === 0 &&
        batchSame(payment.token, MARKET_ZERO) &&
        payment.identifierOrCriteria === 0n
    );
    address(payment.recipient);
    total += scale(payment.startAmount);
  }
  const sellerPayment = c.consideration[0];
  assertBatch(sellerPayment && batchSame(sellerPayment.recipient, c.offerer));
  assertBatch(
    scale(sellerPayment.startAmount) === batchUint(actual.net_wei) &&
      total === batchUint(expected.amount_wei)
  );
  assertBatch(actual.fees?.length === c.consideration.length - 1);
  c.consideration.slice(1).forEach((payment, index) => {
    const fee = actual.fees?.[index];
    assertBatch(
      fee &&
        batchSame(fee.recipient, payment.recipient) &&
        batchUint(fee.amount_wei) === scale(payment.startAmount)
    );
  });
  return c;
}

type Advanced = ReturnType<typeof decodeBatch>["args"][0][number];
function decodeBatch(data: `0x${string}`) {
  return decodeFunctionData({ abi: MARKET_BATCH_ABI, data });
}
function zoneAuthorization(order: Advanced, wallet: string, end: bigint) {
  if (order.parameters.orderType < 2) {
    assertBatch(order.extraData === "0x");
    return;
  }
  const hex = order.extraData.slice(2);
  const byte = (index: number) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  const context = byte(93);
  let length = 146;
  if (context === 0 || context === 1) length = 126;
  else if (context === 7) length = 166;
  assertBatch(
    byte(0) === 0 &&
      [0, 1, 7, 8, 9].includes(context) &&
      hex.length === length * 2
  );
  const fulfiller = `0x${hex.slice(2, 42)}`;
  assertBatch(
    batchSame(fulfiller, wallet) || batchSame(fulfiller, MARKET_ZERO)
  );
  assertBatch(
    BigInt(`0x${hex.slice(42, 58)}`) >= end &&
      `0x${hex.slice(188, 252)}` === MARKET_ZERO_HASH
  );
}

/** Decode the one transaction and independently conserve every selected NFT and payment. */
export function validateMarketBatchOperation(
  operation: ApiMarketBatchOperation,
  expected: ApiMarketBatchPrepareRequest,
  profileWallets: readonly string[],
  now = Date.now()
): void {
  validateBatchOperationBindings(
    operation,
    expected,
    profileWallets,
    now,
    true
  );
}

/** Verify stored terms before mandatory refresh; this never authorizes a wallet request. */
export function validateMarketBatchOperationForRefresh(
  operation: ApiMarketBatchOperation,
  expected: ApiMarketBatchPrepareRequest,
  profileWallets: readonly string[],
  now = Date.now()
): void {
  validateBatchOperationBindings(
    operation,
    expected,
    profileWallets,
    now,
    false
  );
}

function validateBatchOperationBindings(
  operation: ApiMarketBatchOperation,
  expected: ApiMarketBatchPrepareRequest,
  profileWallets: readonly string[],
  now: number,
  requireFreshReview: boolean
): void {
  validateMarketBatchRequest(expected, profileWallets);
  assertBatch(
    marketBatchLiteral(operation.kind, expected.kind) &&
      marketBatchLiteral(operation.execution_policy, expected.execution_policy)
  );
  assertBatch(
    operation.profile_id === expected.profile_id &&
      batchSame(operation.wallet, expected.wallet)
  );
  assertBatch(
    batchSame(operation.currency, expected.currency) &&
      operation.total_wei === expected.amount_wei
  );
  assertBatch(
    Number.isSafeInteger(operation.expires_at) &&
      operation.expires_at >= 0 &&
      (!requireFreshReview || operation.expires_at > now)
  );
  assertBatch(
    operation.approval_transactions.length === 0 &&
      operation.items.length === expected.items.length
  );
  const seconds = BigInt(Math.floor(now / 1000));
  const checked = operation.items.map((item, index) => {
    const selected = expected.items[index];
    assertBatch(selected);
    return validateItem(item, selected, profileWallets, seconds);
  });
  const terms = operation.mirror_terms,
    tx = operation.transaction;
  assertBatch(
    terms &&
      marketBatchLiteral(tx?.purpose, "FULFILL") &&
      tx !== undefined &&
      tx.approval_scope === undefined
  );
  const start = batchUint(terms.start_time),
    end = batchUint(terms.end_time),
    salt = batchUint(terms.salt);
  assertBatch(
    start <= seconds &&
      start < end &&
      (!requireFreshReview || seconds < end) &&
      operation.expires_at <= Number(end * 1000n)
  );
  assertBatch(
    checked.every((order) => order.startTime <= start && order.endTime >= end)
  );
  assertBatch(
    tx.chain_id === 1 &&
      batchSame(tx.sender, expected.wallet) &&
      batchSame(tx.to, MARKET_SEAPORT)
  );
  assertBatch(batchUint(tx.value) === batchUint(expected.amount_wei));
  const gas = batchUint(tx.gas_limit),
    fee = batchUint(tx.max_fee_per_gas);
  assertBatch(
    gas > 0n && fee > 0n && gas * fee <= batchUint(tx.gas_reserve_wei)
  );
  assertBatch(
    isHex(tx.data, { strict: true }) &&
      (tx.data.length - 2) / 2 <= MARKET_BATCH_LIMITS.calldata
  );
  const decoded = decodeBatch(tx.data);
  assertBatch(
    batchSame(
      encodeFunctionData({ abi: MARKET_BATCH_ABI, ...decoded }),
      tx.data
    )
  );
  const [orders, criteria, fulfillments, residual] = decoded.args;
  assertBatch(
    orders.length === checked.length + 1 &&
      criteria.length === 0 &&
      batchSame(residual, expected.wallet)
  );
  checked.forEach((c, index) => {
    const advanced = orders[index],
      selected = expected.items[index];
    assertBatch(advanced && selected && c.offer[0]);
    assertBatch(
      advanced.parameters.totalOriginalConsiderationItems ===
        BigInt(c.consideration.length)
    );
    assertBatch(
      batchSame(
        hashStruct({
          data: { ...advanced.parameters, counter: c.counter },
          primaryType: "OrderComponents",
          types: MARKET_ORDER_TYPES,
        }),
        selected.order.order_hash
      )
    );
    assertBatch(
      advanced.numerator > 0n &&
        advanced.denominator > 0n &&
        advanced.numerator <= advanced.denominator
    );
    assertBatch(
      advanced.numerator * c.offer[0].startAmount ===
        batchUint(selected.quantity) * advanced.denominator
    );
    assertBatch(advanced.signature !== "0x");
    zoneAuthorization(advanced, expected.wallet, end);
  });
  validateMirror(orders[checked.length], expected, start, end, salt);
  validateBatchFlow(orders, fulfillments, expected);
}

function validateMirror(
  mirror: Advanced | undefined,
  expected: ApiMarketBatchPrepareRequest,
  start: bigint,
  end: bigint,
  salt: bigint
) {
  assertBatch(
    mirror?.signature === "0x" &&
      mirror.extraData === "0x" &&
      mirror.numerator === 1n &&
      mirror.denominator === 1n
  );
  const m = mirror.parameters;
  assertBatch(
    batchSame(m.offerer, expected.wallet) &&
      batchSame(m.zone, MARKET_ZERO) &&
      m.orderType === 0
  );
  assertBatch(
    m.startTime === start &&
      m.endTime === end &&
      m.salt === salt &&
      batchSame(m.zoneHash, MARKET_ZERO_HASH) &&
      batchSame(m.conduitKey, MARKET_ZERO_HASH)
  );
  assertBatch(
    m.offer.length === 1 &&
      m.totalOriginalConsiderationItems === BigInt(m.consideration.length)
  );
  const payment = m.offer[0];
  assertBatch(
    payment?.itemType === 0 &&
      batchSame(payment.token, MARKET_ZERO) &&
      payment.identifierOrCriteria === 0n
  );
  assertBatch(
    payment.startAmount === batchUint(expected.amount_wei) &&
      payment.endAmount === payment.startAmount
  );
  const allocations = expected.items.flatMap((item) =>
    item.allocations.map((allocation) => ({
      ...allocation,
      ...asset(item.asset_key),
    }))
  );
  assertBatch(m.consideration.length === allocations.length);
  m.consideration.forEach((received, index) => {
    const allocation = allocations[index];
    assertBatch(
      received.itemType === allocation?.type &&
        batchSame(received.token, allocation.contract) &&
        received.identifierOrCriteria === allocation.identifier
    );
    assertBatch(
      batchSame(received.recipient, allocation.recipient) &&
        received.startAmount === batchUint(allocation.quantity) &&
        received.endAmount === received.startAmount
    );
  });
}

/** Authorization bytes may refresh; every price, recipient, order and gas cap must be reviewed again if changed. */
export function marketBatchReviewTerms(
  operation: ApiMarketBatchOperation
): string {
  const tx = operation.transaction;
  return JSON.stringify({
    profile: operation.profile_id,
    wallet: operation.wallet,
    kind: operation.kind,
    policy: operation.execution_policy,
    currency: operation.currency,
    total: operation.total_wei,
    items: operation.items.map((item) => ({
      ...item,
      reviewed_order: item.reviewed_order?.digest,
    })),
    approvals: operation.approval_transactions,
    transaction: tx
      ? {
          sender: tx.sender,
          to: tx.to,
          value: tx.value,
          purpose: tx.purpose,
          gas: tx.gas_limit,
          fee: tx.max_fee_per_gas,
          reserve: tx.gas_reserve_wei,
        }
      : null,
  });
}
