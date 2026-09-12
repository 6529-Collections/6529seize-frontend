import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";

interface Item {
  readonly itemType: number;
  readonly token: string;
  readonly identifierOrCriteria: bigint;
  readonly startAmount: bigint;
  readonly endAmount: bigint;
  readonly recipient?: string;
}
interface Order {
  readonly numerator: bigint;
  readonly denominator: bigint;
  readonly parameters: {
    readonly offer: readonly Item[];
    readonly consideration: readonly Item[];
  };
}
interface Component {
  readonly orderIndex: bigint;
  readonly itemIndex: bigint;
}
interface Fulfillment {
  readonly offerComponents: readonly Component[];
  readonly considerationComponents: readonly Component[];
}
interface Inventory {
  readonly item: Item;
  remaining: bigint;
}
function ensure(value: unknown): asserts value {
  if (!value) throw new Error("MARKET_REVIEW_MISMATCH");
}
function inventory(orders: readonly Order[], side: "offer" | "consideration") {
  const result = new Map<string, Inventory>();
  orders.forEach((order, orderIndex) => {
    ensure(
      order.numerator > 0n &&
        order.denominator > 0n &&
        order.numerator <= order.denominator
    );
    order.parameters[side].forEach((item, itemIndex) => {
      const product = item.startAmount * order.numerator;
      ensure(
        item.startAmount === item.endAmount &&
          product > 0n &&
          product % order.denominator === 0n
      );
      result.set(`${orderIndex}:${itemIndex}`, {
        item,
        remaining: product / order.denominator,
      });
    });
  });
  return result;
}
function resolve(
  map: Map<string, Inventory>,
  references: readonly Component[]
) {
  // This supported matcher shape is one exact source to one exact destination.
  ensure(references.length === 1);
  const reference = references[0];
  ensure(reference);
  const entry = map.get(`${reference.orderIndex}:${reference.itemIndex}`);
  ensure(entry && entry.remaining > 0n);
  return { entry, orderIndex: reference.orderIndex };
}
function nftFlowKey(
  seller: bigint | number,
  token: string,
  id: bigint | string,
  recipient: string
) {
  return `${seller}:${token.toLowerCase()}:${id}:${recipient.toLowerCase()}`;
}
function add(map: Map<string, bigint>, key: string, amount: bigint) {
  map.set(key, (map.get(key) ?? 0n) + amount);
}

/** Conservation over decoded inventories, independently of the server's mapping builder. */
export function validateBatchFlow(
  orders: readonly Order[],
  fulfillments: readonly Fulfillment[],
  expected: ApiMarketBatchPrepareRequest
) {
  const offers = inventory(orders, "offer"),
    consideration = inventory(orders, "consideration");
  const mirror = BigInt(expected.items.length),
    actualNFTs = new Map<string, bigint>();
  for (const fulfillment of fulfillments) {
    const source = resolve(offers, fulfillment.offerComponents);
    const destination = resolve(
      consideration,
      fulfillment.considerationComponents
    );
    const offered = source.entry.item,
      received = destination.entry.item;
    ensure(
      offered.itemType === received.itemType &&
        offered.token.toLowerCase() === received.token.toLowerCase()
    );
    ensure(
      offered.identifierOrCriteria === received.identifierOrCriteria &&
        received.recipient
    );
    const payment = offered.itemType === 0;
    if (payment)
      ensure(source.orderIndex === mirror && destination.orderIndex < mirror);
    else
      ensure(
        (offered.itemType === 2 || offered.itemType === 3) &&
          source.orderIndex < mirror &&
          destination.orderIndex === mirror
      );
    const amount =
      source.entry.remaining < destination.entry.remaining
        ? source.entry.remaining
        : destination.entry.remaining;
    source.entry.remaining -= amount;
    destination.entry.remaining -= amount;
    if (!payment)
      add(
        actualNFTs,
        nftFlowKey(
          source.orderIndex,
          offered.token,
          offered.identifierOrCriteria,
          received.recipient
        ),
        amount
      );
  }
  // Exhaustion proves no residual NFTs or ETH, skipped seller, unpaid fee, duplicate or partial fulfillment.
  ensure(
    [...offers.values(), ...consideration.values()].every(
      (item) => item.remaining === 0n
    )
  );
  const intendedNFTs = new Map<string, bigint>();
  expected.items.forEach((item, index) => {
    const [, token, id] = item.asset_key.split(":");
    ensure(token && id);
    for (const allocation of item.allocations)
      add(
        intendedNFTs,
        nftFlowKey(index, token, id, allocation.recipient),
        BigInt(allocation.quantity)
      );
  });
  ensure(
    actualNFTs.size === intendedNFTs.size &&
      [...intendedNFTs].every(([key, value]) => actualNFTs.get(key) === value)
  );
}
