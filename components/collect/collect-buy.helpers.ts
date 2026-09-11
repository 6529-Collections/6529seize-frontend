import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { MARKET_SEAPORT, MARKET_ZERO } from "./market-validation";

const UINT = /^(0|[1-9][0-9]{0,77})$/;
const UINT256_MAX = (1n << 256n) - 1n;

function unsignedAmount(value: unknown): bigint | null {
  if (typeof value !== "string" || !UINT.test(value)) return null;
  const amount = BigInt(value);
  return amount <= UINT256_MAX ? amount : null;
}

// Optional metadata allows older deployments to retain their quoted whole lot.
// Never infer partial execution from aggregate price divisibility alone.
type PurchaseMetadata = Partial<
  Record<"purchase_quantity" | "quantity_step" | "available_quantity", unknown>
>;
export function collectOrderPurchaseQuantity(
  order: ApiMarketTradeOrder
): string | null {
  const metadata: ApiMarketTradeOrder & PurchaseMetadata = order;
  const quantity =
    metadata.purchase_quantity === undefined
      ? order.quantity
      : metadata.purchase_quantity;
  return typeof quantity === "string" &&
    collectBuyAmount(order, quantity) !== null
    ? quantity
    : null;
}
export function collectOrderAvailableQuantity(
  order: ApiMarketTradeOrder
): string | null {
  const metadata: ApiMarketTradeOrder & PurchaseMetadata = order;
  const value = unsignedAmount(
    metadata.available_quantity === undefined
      ? order.quantity
      : metadata.available_quantity
  );
  return value !== null && value > 0n ? value.toString() : null;
}
export function collectOrderQuantityStep(
  order: ApiMarketTradeOrder
): string | null {
  const metadata: ApiMarketTradeOrder & PurchaseMetadata = order;
  const value = unsignedAmount(
    metadata.quantity_step === undefined
      ? order.quantity
      : metadata.quantity_step
  );
  return value !== null && value > 0n ? value.toString() : null;
}

/** Exact displayed consideration for the requested copies, including listing fees. */
export function collectBuyAmount(
  order: ApiMarketTradeOrder,
  quantity: string
): string | null {
  const copies = unsignedAmount(quantity);
  const available = unsignedAmount(collectOrderAvailableQuantity(order));
  const quoted = unsignedAmount(order.quantity);
  const step = unsignedAmount(collectOrderQuantityStep(order));
  const total = unsignedAmount(order.total_wei);
  if (
    copies === null ||
    available === null ||
    total === null ||
    quoted === null ||
    quoted === 0n ||
    step === null ||
    step === 0n ||
    copies === 0n ||
    available === 0n ||
    total === 0n ||
    copies > available ||
    copies % step !== 0n
  )
    return null;
  const product = total * copies;
  if (product % quoted !== 0n) return null;
  for (const value of [
    order.net_wei,
    ...order.fees.map((fee) => fee.amount_wei),
  ]) {
    const amount = unsignedAmount(value);
    if (amount === null || (amount * copies) % quoted !== 0n) return null;
  }
  return (product / quoted).toString();
}

/** Discovery is indicative; the existing preparation and execution checks remain authoritative. */
export function collectBuyListings(options: {
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly assetKey: string;
  readonly quantity?: string;
  readonly profileWallets: readonly string[];
  readonly nowSeconds: number;
}): ApiMarketTradeOrder[] {
  if (!Number.isFinite(options.nowSeconds) || options.nowSeconds < 0) return [];
  const wallets = new Set(
    options.profileWallets.map((item) => item.toLowerCase())
  );
  const now = BigInt(Math.floor(options.nowSeconds));
  return options.orders
    .flatMap((order) => {
      const start = unsignedAmount(order.start_time);
      const end = unsignedAmount(order.end_time);
      const quantity = options.quantity ?? collectOrderPurchaseQuantity(order);
      const amount =
        quantity === null ? null : collectBuyAmount(order, quantity);
      const eligible =
        order.asset_key === options.assetKey &&
        order.side === ApiMarketTradeOrderSideEnum.Listing &&
        order.currency.toLowerCase() === MARKET_ZERO &&
        order.identity.protocol_address.toLowerCase() === MARKET_SEAPORT &&
        !wallets.has(order.maker.toLowerCase()) &&
        start !== null &&
        end !== null &&
        start <= now &&
        end > now &&
        amount !== null;
      return eligible ? [{ order, amount: BigInt(amount), quantity }] : [];
    })
    .sort((left, right) => {
      if (
        options.quantity === undefined &&
        (left.quantity === "1") !== (right.quantity === "1")
      )
        return left.quantity === "1" ? -1 : 1;
      if (left.amount !== right.amount)
        return left.amount < right.amount ? -1 : 1;
      return left.order.identity.order_hash.localeCompare(
        right.order.identity.order_hash
      );
    })
    .map(({ order }) => order);
}

export function collectListingKey(order: ApiMarketTradeOrder): string {
  return `${order.asset_key}:${order.identity.protocol_address.toLowerCase()}:${order.identity.order_hash.toLowerCase()}`;
}
