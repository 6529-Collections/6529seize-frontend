import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { MARKET_SEAPORT, MARKET_ZERO } from "./market-validation";

const UINT = /^(0|[1-9][0-9]{0,77})$/;
const UINT256_MAX = (1n << 256n) - 1n;

function unsignedAmount(value: string): bigint | null {
  if (!UINT.test(value)) return null;
  const amount = BigInt(value);
  return amount <= UINT256_MAX ? amount : null;
}

/** Exact displayed consideration for the requested copies, including listing fees. */
export function collectBuyAmount(
  order: ApiMarketTradeOrder,
  quantity: string
): string | null {
  const copies = unsignedAmount(quantity);
  const available = unsignedAmount(order.quantity);
  const total = unsignedAmount(order.total_wei);
  if (
    copies === null ||
    available === null ||
    total === null ||
    copies === 0n ||
    available === 0n ||
    total === 0n ||
    copies > available
  )
    return null;
  const product = total * copies;
  if (product % available !== 0n) return null;
  return (product / available).toString();
}

/** Discovery is indicative; the existing preparation and execution checks remain authoritative. */
export function collectBuyListings(options: {
  readonly orders: readonly ApiMarketTradeOrder[];
  readonly assetKey: string;
  readonly quantity: string;
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
      const amount = collectBuyAmount(order, options.quantity);
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
      return eligible ? [{ order, amount: BigInt(amount) }] : [];
    })
    .sort((left, right) => {
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
