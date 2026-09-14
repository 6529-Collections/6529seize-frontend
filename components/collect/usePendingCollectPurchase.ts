"use client";

import type { ApiMarketIdentity } from "@/generated/models/ApiMarketIdentity";
import {
  readPendingMarketPurchases,
  usePendingMarketPurchases,
  type PendingMarketPurchase,
} from "./market-activity-store";

/** Reserve an exact source order across checkout entry points while it resolves. */
export function usePendingCollectPurchase({
  profileId,
  assetKey,
  identity,
  operationId,
  enabled,
}: {
  readonly profileId: string | undefined;
  readonly assetKey: string;
  readonly identity: ApiMarketIdentity | undefined;
  readonly operationId: string | undefined;
  readonly enabled: boolean;
}) {
  const purchases = usePendingMarketPurchases(profileId);
  const matches = (purchase: PendingMarketPurchase, order = identity) =>
    enabled &&
    order !== undefined &&
    purchase.operationId !== operationId &&
    purchase.assetKey.toLowerCase() === assetKey.toLowerCase() &&
    purchase.protocolAddress.toLowerCase() ===
      order.protocol_address.toLowerCase() &&
    purchase.orderHash.toLowerCase() === order.order_hash.toLowerCase();
  return {
    blocked: purchases.some((purchase) => matches(purchase)),
    assertAvailable: (order = identity) => {
      // Read at the event boundary too: another checkout may submit while this
      // one is awaiting a quote or a wallet connection.
      if (
        profileId &&
        readPendingMarketPurchases(profileId).some((purchase) =>
          matches(purchase, order)
        )
      )
        throw new Error("MARKET_PURCHASE_PENDING");
    },
  };
}
