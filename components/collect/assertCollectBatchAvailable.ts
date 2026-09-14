import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { readPendingMarketPurchases } from "./market-activity-store";

/** Recheck exact source orders immediately before preparing or sending a batch. */
export function assertCollectBatchAvailable(
  request: ApiMarketBatchPrepareRequest,
  operationId?: string
) {
  const pending = readPendingMarketPurchases(request.profile_id);
  if (
    pending.some(
      (purchase) =>
        purchase.operationId !== operationId &&
        request.items.some(
          (item) =>
            item.asset_key.toLowerCase() === purchase.assetKey.toLowerCase() &&
            item.order.protocol_address.toLowerCase() ===
              purchase.protocolAddress.toLowerCase() &&
            item.order.order_hash.toLowerCase() ===
              purchase.orderHash.toLowerCase()
        )
    )
  )
    throw new Error("MARKET_PURCHASE_PENDING");
}
