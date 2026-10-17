"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a function that starts a new request and hands back its
 * `AbortSignal`. Starting a request aborts the previous one, and unmounting
 * aborts the one in flight, so a caller can drop stale responses with
 * `if (signal.aborted) return;` after each `await`.
 */
export function useLatestRequestSignal(): () => AbortSignal {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    []
  );

  return useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }, []);
}
