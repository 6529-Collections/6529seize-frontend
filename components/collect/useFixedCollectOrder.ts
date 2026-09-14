"use client";

import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { fetchExactMarketOrder } from "@/services/api/market-api";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import { fixedCollectOrderMatches } from "./collect-fixed-order";

export function useFixedCollectOrder(options: {
  readonly fixed: boolean;
  readonly action: CollectTradeAction;
  readonly assetKey: string;
  readonly initialOrder: ApiMarketTradeOrder | undefined;
  readonly draft: CollectTradeDraft;
  readonly profileId: string | undefined;
  readonly profileWallets: readonly string[];
  readonly wallet: string | undefined;
  readonly canSign: boolean;
  readonly maximumQuantity?: string | undefined;
}) {
  const identity = JSON.stringify(options);
  const generation = useMemo(() => ({ identity }), [identity]);
  const active = useRef<{
    generation: object;
    controller: AbortController;
  } | null>(null);
  useLayoutEffect(() => {
    const controller = new AbortController();
    active.current = { generation, controller };
    return () => {
      controller.abort();
      active.current = null;
    };
  }, [generation]);

  const guard = () => {
    if (
      options.fixed &&
      (active.current?.generation !== generation || !options.canSign)
    )
      throw new Error("MARKET_CONNECTION_CHANGED");
  };
  const refresh = async (): Promise<ApiMarketTradeOrder> => {
    guard();
    const initial = options.initialOrder;
    if (!initial || !["buy", "accept"].includes(options.action))
      throw new Error("MARKET_FIXED_ORDER_CHANGED");
    const action = options.action === "buy" ? "buy" : "accept";
    const current = await fetchExactMarketOrder(
      initial.identity.order_hash,
      initial.identity.protocol_address,
      options.assetKey,
      action === "buy" ? "LISTING" : "OFFER",
      active.current?.controller.signal
    );
    guard();
    if (
      !fixedCollectOrderMatches({
        initial,
        current,
        assetKey: options.assetKey,
        action,
        quantity: options.draft.quantity,
        profileWallets: options.profileWallets,
        nowSeconds: Math.floor(Date.now() / 1000),
        maximumQuantity: options.maximumQuantity,
      })
    )
      throw new Error("MARKET_FIXED_ORDER_CHANGED");
    return current;
  };
  return { guard, refresh };
}
