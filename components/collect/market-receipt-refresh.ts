import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import { ApiMarketBatchOperationKindEnum } from "@/generated/models/ApiMarketBatchOperation";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";

/** Supplemental evidence never holds up a confirmed receipt or authorizes a send. */
export function marketReceiptRefreshInterval(
  operation: ApiMarketOperation | ApiMarketBatchOperation,
  now = Date.now()
): number | false {
  if (operation.state.toString() === "LIVE") return 30_000;
  if (
    operation.state.toString() !== "CONFIRMED" ||
    !operation.transaction_hash ||
    now - operation.updated_at > 10 * 60_000
  )
    return false;
  const missingOrderEvidence =
    operation.kind === ApiMarketBatchOperationKindEnum.BuyBatch
      ? operation.items.length === 0 ||
        operation.items.some(
          (item) =>
            !operation.settlement?.items.some(
              (settled) =>
                settled.asset_key.toLowerCase() ===
                  item.asset_key.toLowerCase() &&
                settled.order.order_hash.toLowerCase() ===
                  item.order.order_hash.toLowerCase() &&
                settled.order.protocol_address.toLowerCase() ===
                  item.order.protocol_address.toLowerCase() &&
                settled.order_remaining_quantity !== undefined
            )
        )
      : operation.kind === ApiMarketKind.Buy &&
        operation.settlement?.order_remaining_quantity === undefined;
  return !operation.receipt?.payment || missingOrderEvidence ? 30_000 : false;
}
