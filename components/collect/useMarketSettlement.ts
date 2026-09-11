"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { STATS_QUERY_KEY } from "@/components/user/collected/stats/constants";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/** A receipt can arrive from polling or recovery, not only from the wallet request. */
export function useMarketSettlement(
  operation: ApiMarketOperation | null,
  onSettled?: () => void
) {
  const client = useQueryClient();
  const observed = useRef<string | null>(null);
  const state = operation?.state;
  const id = operation?.id;
  useEffect(() => {
    if (
      !id ||
      state === undefined ||
      !["LIVE", "CONFIRMED", "CANCELLED"].includes(state)
    )
      return;
    const event = `${id}:${state}`;
    if (observed.current === event) return;
    observed.current = event;
    for (const key of [
      QueryKey.MARKET_MY_OPERATIONS,
      QueryKey.MARKET_ORDERS,
      QueryKey.MARKET_LISTINGS,
      QueryKey.COLLECT_RULES,
      QueryKey.PROFILE_COLLECTED,
      QueryKey.PROFILE,
      STATS_QUERY_KEY,
    ])
      void client.invalidateQueries({ queryKey: [key] });
    if (state.toString() === "CONFIRMED") onSettled?.();
  }, [id, state, client, onSettled]);
}
