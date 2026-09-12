"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { fetchMarketOrders } from "@/services/api/market-api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  collectBuyListings,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";
import {
  collectProfileWallets,
  defaultCollectRecipient,
} from "./collect-recipient.helpers";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";

interface UseCollectTradeOrdersOptions {
  readonly action: CollectTradeAction;
  readonly assetKey: string;
  readonly operation: ApiMarketOperation | null;
  readonly layout: "standard" | "inline-buy";
  readonly initialOrder?: ApiMarketTradeOrder | undefined;
  readonly fixedOrder?: boolean | undefined;
  readonly initialQuantity?: string | undefined;
  readonly initialRecipient?: string | undefined;
  readonly initialUnitPriceEth?: string | undefined;
  readonly initialExpiryHours?: "24" | "168" | "720" | undefined;
  readonly profile: ApiIdentity | null;
  readonly wallet?: string | undefined;
}

/** Own the mutable order selection and draft derived from the current order book. */
export function useCollectTradeOrders({
  action,
  assetKey,
  operation,
  layout,
  initialOrder,
  fixedOrder = false,
  initialQuantity,
  initialRecipient,
  initialUnitPriceEth,
  initialExpiryHours,
  profile,
  wallet,
}: UseCollectTradeOrdersOptions) {
  const [chosenOrder, setSelectedOrder] = useState<ApiMarketTradeOrder | null>(
    initialOrder ?? null
  );
  const [inputDraft, setDraft] = useState<CollectTradeDraft>({
    quantity: initialQuantity ?? "1",
    unitPriceEth: action === "offer" ? (initialUnitPriceEth ?? "") : "",
    expiryHours: action === "offer" ? (initialExpiryHours ?? "168") : "168",
    recipient: initialRecipient ?? defaultCollectRecipient(profile, wallet),
  });
  const [quantityEdited, setQuantityEdited] = useState(
    initialQuantity !== undefined
  );
  const needsOrder = action === "buy" || action === "accept";
  const inlineBuy = layout === "inline-buy" && action === "buy";
  const orders = useQuery({
    queryKey: [QueryKey.MARKET_ORDERS, assetKey, action],
    queryFn: ({ signal }) =>
      fetchMarketOrders(
        assetKey,
        action === "buy" ? "LISTING" : "OFFER",
        signal
      ),
    enabled: needsOrder && !fixedOrder && !operation && Boolean(assetKey),
    staleTime: 0,
  });
  const buyOrders = inlineBuy
    ? collectBuyListings({
        orders: orders.data?.orders ?? [],
        assetKey,
        ...(quantityEdited ? { quantity: inputDraft.quantity } : {}),
        profileWallets: collectProfileWallets(profile).map(
          (item) => item.wallet
        ),
        nowSeconds: orders.dataUpdatedAt / 1000,
      })
    : [];
  const selectedOrder =
    chosenOrder ?? (inlineBuy && !fixedOrder ? (buyOrders[0] ?? null) : null);
  const automaticQuantity = selectedOrder
    ? collectOrderPurchaseQuantity(selectedOrder)
    : null;
  const draft =
    inlineBuy && !quantityEdited && automaticQuantity
      ? { ...inputDraft, quantity: automaticQuantity }
      : inputDraft;

  return {
    chosenOrder,
    setSelectedOrder,
    inputDraft,
    setDraft,
    quantityEdited,
    setQuantityEdited,
    orders,
    buyOrders,
    selectedOrder,
    automaticQuantity,
    draft,
    needsOrder,
    inlineBuy,
  };
}
