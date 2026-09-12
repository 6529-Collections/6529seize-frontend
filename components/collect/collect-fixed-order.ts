import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import { collectBuyAmount } from "./collect-buy.helpers";
import { MARKET_SEAPORT, MARKET_WETH, MARKET_ZERO } from "./market-validation";

const UINT256_MAX = (1n << 256n) - 1n;

function orderTerms(order: ApiMarketTradeOrder): string {
  return JSON.stringify([
    order.asset_key,
    order.identity.protocol_address.toLowerCase(),
    order.identity.order_hash.toLowerCase(),
    order.side,
    order.maker.toLowerCase(),
    order.recipient.toLowerCase(),
    order.currency.toLowerCase(),
    order.quantity,
    order.total_wei,
    order.net_wei,
    order.fees.map((fee) => [fee.recipient.toLowerCase(), fee.amount_wei]),
    order.start_time,
    order.end_time,
    order.purchase_quantity ?? order.quantity,
    order.quantity_step ?? order.quantity,
    order.available_quantity ?? order.quantity,
  ]);
}

/** A row review must retain its exact identity, quantities and signed economics. */
export function fixedCollectOrderMatches(options: {
  readonly initial: ApiMarketTradeOrder;
  readonly current: ApiMarketTradeOrder;
  readonly assetKey: string;
  readonly action: "buy" | "accept";
  readonly quantity: string;
  readonly profileWallets: readonly string[];
  readonly nowSeconds: number;
  readonly maximumQuantity?: string | undefined;
}): boolean {
  const { initial, current, assetKey, action, quantity, profileWallets } =
    options;
  try {
    if (!Number.isSafeInteger(options.nowSeconds)) return false;
    if (
      options.maximumQuantity !== undefined &&
      (!/^[1-9][0-9]{0,77}$/.test(options.maximumQuantity) ||
        BigInt(options.maximumQuantity) > UINT256_MAX ||
        !/^[1-9][0-9]{0,77}$/.test(quantity) ||
        BigInt(quantity) > BigInt(options.maximumQuantity))
    )
      return false;
    const now = BigInt(options.nowSeconds);
    return (
      current.asset_key === assetKey &&
      current.side ===
        (action === "buy"
          ? ApiMarketTradeOrderSideEnum.Listing
          : ApiMarketTradeOrderSideEnum.Offer) &&
      current.identity.protocol_address.toLowerCase() === MARKET_SEAPORT &&
      current.currency.toLowerCase() ===
        (action === "buy" ? MARKET_ZERO : MARKET_WETH) &&
      !profileWallets.some(
        (wallet) => wallet.toLowerCase() === current.maker.toLowerCase()
      ) &&
      /^(0|[1-9][0-9]{0,77})$/.test(current.start_time) &&
      /^(0|[1-9][0-9]{0,77})$/.test(current.end_time) &&
      BigInt(current.start_time) <= now &&
      BigInt(current.end_time) > now &&
      collectBuyAmount(current, quantity) !== null &&
      orderTerms(initial) === orderTerms(current)
    );
  } catch {
    return false;
  }
}
