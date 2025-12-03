"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UseClientNavigationOptions<T, TOptions = undefined> {
  /**
   * Initial state value (typically derived from URL/searchParams)
   */
  readonly initialState: T;

  /**
   * Build the target URL from state and optional navigation options
   */
  readonly buildUrl: (state: T, options?: TOptions) => string;

  /**
   * Parse state from the current window URL (for popstate handling)
   */
  readonly parseUrl: () => T;

  /**
   * Determine if we can use pushState for a given target URL.
   * Return true for fast client-side nav, false for router.push
   */
  readonly canUsePushState: (targetUrl: string, options?: TOptions) => boolean;
}

export interface UseClientNavigationResult<T, TOptions = undefined> {
  readonly state: T;
  readonly navigate: (
    newState: T,
    options?: TOptions & { replace?: boolean }
  ) => void;
}

/**
 * Generic hook for client-side navigation using pushState when possible.
 * Falls back to router.push for cross-zone navigation.
 */
export function useClientNavigation<T, TOptions = undefined>({
  initialState,
  buildUrl,
  parseUrl,
  canUsePushState,
}: UseClientNavigationOptions<T, TOptions>): UseClientNavigationResult<
  T,
  TOptions
> {
  const router = useRouter();
  const [state, setState] = useState<T>(initialState);

  // Sync state when initialState changes (after router.push navigation)
  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  // Sync with back/forward navigation
  useEffect(() => {
    if (globalThis.window === undefined) return;

    const { window: browserWindow } = globalThis;
    if (!browserWindow) return;

    const onPopState = () => {
      setState(parseUrl());
    };

    browserWindow.addEventListener("popstate", onPopState);
    return () => browserWindow.removeEventListener("popstate", onPopState);
  }, [parseUrl]);

  const navigate = useCallback(
    (newState: T, options?: TOptions & { replace?: boolean }) => {
      if (globalThis.window === undefined) return;

      const { window: browserWindow } = globalThis;
      if (!browserWindow) return;

      const target = buildUrl(newState, options);
      const currentUrl =
        browserWindow.location.pathname + browserWindow.location.search;

      if (currentUrl === target) {
        setState(newState);
        return;
      }

      if (canUsePushState(target, options)) {
        const method = options?.replace ? "replaceState" : "pushState";
        browserWindow.history[method](null, "", target);
        setState(newState);
      } else {
        // Set state immediately to avoid flash, then navigate
        setState(newState);
        if (options?.replace) {
          router.replace(target);
        } else {
          router.push(target);
        }
      }
    },
    [buildUrl, canUsePushState, router]
  );

  return {
    state,
    navigate,
  };
}
