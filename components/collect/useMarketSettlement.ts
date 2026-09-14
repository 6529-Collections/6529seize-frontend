"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { STATS_QUERY_KEY } from "@/components/user/collected/stats/constants";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import { recordMarketActivity } from "./market-activity-store";

export function invalidateMarketSettlement(client: QueryClient) {
  for (const key of [
    QueryKey.MARKET_MY_OPERATIONS,
    QueryKey.MARKET_ORDERS,
    QueryKey.MARKET_LISTINGS,
    QueryKey.COLLECT_RULES,
    QueryKey.COLLECT_ANALYSIS,
    QueryKey.PROFILE_COLLECTED,
    QueryKey.PROFILE,
    STATS_QUERY_KEY,
  ])
    void client.invalidateQueries({ queryKey: [key] });
}

/** A receipt can arrive from polling or recovery, not only from the wallet request. */
export function useMarketSettlement(
  operation: ApiMarketOperation | ApiMarketBatchOperation | null,
  onSettled?: () => void,
  onMarketChange?: () => void
) {
  const client = useQueryClient();
  const observed = useRef<string | null>(null);
  const confirmed = useRef(new Set<string>());
  const state = operation?.state;
  const id = operation?.id;
  useEffect(() => {
    if (operation) recordMarketActivity(operation);
  }, [operation]);
  useEffect(() => {
    if (
      !id ||
      state === undefined ||
      !["LIVE", "CONFIRMED", "CANCELLED", "EXPIRED"].includes(state)
    )
      return;
    const event = `${id}:${state}:${JSON.stringify(operation.settlement ?? null)}`;
    if (observed.current === event) return;
    observed.current = event;
    invalidateMarketSettlement(client);
    onMarketChange?.();
    if (state.toString() === "CONFIRMED" && !confirmed.current.has(id)) {
      confirmed.current.add(id);
      onSettled?.();
    }
  }, [id, state, operation?.settlement, client, onSettled, onMarketChange]);
}
