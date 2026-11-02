"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import {
  refreshInfiniteQueryHead,
  type InfiniteHeadStrategy,
  type InfinitePageAdapter,
} from "@/components/react-query-wrapper/utils/refreshInfiniteQueryHead";

interface UseInfiniteHeadRefetchProps<TPage, TItem> {
  readonly queryKey: QueryKey;
  /** Full refetch, used whenever the first page cannot be refreshed alone. */
  readonly refetch: () => Promise<unknown>;
  readonly strategy: InfiniteHeadStrategy;
  readonly adapter: InfinitePageAdapter<TPage, TItem>;
}

/**
 * A stable replacement for `refetch` in realtime handlers: it refreshes just
 * the first page of the loaded infinite list and only falls back to refetching
 * every loaded page when the first page cannot be merged safely.
 */
export function useInfiniteHeadRefetch<TPage, TItem>({
  queryKey,
  refetch,
  strategy,
  adapter,
}: UseInfiniteHeadRefetchProps<TPage, TItem>): () => Promise<unknown> {
  const queryClient = useQueryClient();
  const latestRef = useRef({ queryKey, refetch, strategy, adapter });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    latestRef.current = { queryKey, refetch, strategy, adapter };
  }, [adapter, queryKey, refetch, strategy]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    return () => controller.abort();
  }, []);

  return useCallback(async () => {
    const signal = controllerRef.current?.signal;
    if (!signal || signal.aborted) {
      return;
    }

    const latest = latestRef.current;
    const refreshed = await refreshInfiniteQueryHead({
      queryClient,
      queryKey: latest.queryKey,
      strategy: latest.strategy,
      adapter: latest.adapter,
      signal,
    });
    if (!refreshed) {
      await latest.refetch();
    }
  }, [queryClient]);
}
