"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_REFETCH_DEBOUNCE_MS = 1000;

interface UseDebouncedQueryRefetchProps {
  readonly refetch: () => Promise<unknown>;
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly debounceMs?: number | undefined;
}

export function useDebouncedQueryRefetch({
  refetch,
  isFetching,
  isFetchingNextPage,
  debounceMs = DEFAULT_REFETCH_DEBOUNCE_MS,
}: UseDebouncedQueryRefetchProps) {
  const lastRefetchTimeRef = useRef<number>(0);
  const pendingRefetchRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(isFetching);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    isFetchingRef.current = isFetching;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetching, isFetchingNextPage]);

  const clearScheduledRefetch = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const executeRefetch = useCallback(() => {
    lastRefetchTimeRef.current = Date.now();
    pendingRefetchRef.current = false;
    void refetch().catch(() => {
      // Error surfaced via query state
    });
  }, [refetch]);

  const scheduleRefetch = useCallback(
    (delayMs: number) => {
      pendingRefetchRef.current = true;
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (isFetchingRef.current || isFetchingNextPageRef.current) {
          return;
        }
        executeRefetch();
      }, delayMs);
    },
    [executeRefetch]
  );

  const requestRefetch = useCallback(() => {
    clearScheduledRefetch();

    if (isFetching || isFetchingNextPage) {
      pendingRefetchRef.current = true;
      return;
    }

    const timeSinceLastRefetch = Date.now() - lastRefetchTimeRef.current;
    if (timeSinceLastRefetch < debounceMs) {
      scheduleRefetch(debounceMs - timeSinceLastRefetch);
      return;
    }

    executeRefetch();
  }, [
    clearScheduledRefetch,
    debounceMs,
    executeRefetch,
    isFetching,
    isFetchingNextPage,
    scheduleRefetch,
  ]);

  useEffect(() => {
    if (!isFetching && !isFetchingNextPage && pendingRefetchRef.current) {
      clearScheduledRefetch();

      const timeSinceLastRefetch = Date.now() - lastRefetchTimeRef.current;
      if (timeSinceLastRefetch >= debounceMs) {
        executeRefetch();
      } else {
        scheduleRefetch(debounceMs - timeSinceLastRefetch);
      }
    }

    return clearScheduledRefetch;
  }, [
    clearScheduledRefetch,
    debounceMs,
    executeRefetch,
    isFetching,
    isFetchingNextPage,
    scheduleRefetch,
  ]);

  return requestRefetch;
}
