"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UseClientNavigationOptions<T, TOptions = undefined> {
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
  /** Keep source state until the route supplies its committed initialState. */
  readonly deferRouteState?: boolean;
}

interface UseClientNavigationResult<T, TOptions = undefined> {
  readonly state: T;
  readonly navigate: (
    newState: T,
    options?: TOptions & { replace?: boolean | undefined }
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
  deferRouteState = false,
}: UseClientNavigationOptions<T, TOptions>): UseClientNavigationResult<
  T,
  TOptions
> {
  const router = useRouter();
  const [navigation, setNavigation] = useState({
    route: initialState,
    value: initialState,
  });
  if (!deferRouteState && !Object.is(navigation.route, initialState)) {
    setNavigation({ route: initialState, value: initialState });
  }
  // A history-only update can be immediate. A newly committed route owns its
  // value directly, without copying it into state after a stale frame paints.
  const state = deferRouteState ? initialState : navigation.value;

  // Sync with back/forward navigation
  useEffect(() => {
    if (deferRouteState) return;
    if (globalThis.window === undefined) return;

    const { window: browserWindow } = globalThis;
    if (!browserWindow) return;

    const onPopState = () => {
      setNavigation({ route: initialState, value: parseUrl() });
    };

    browserWindow.addEventListener("popstate", onPopState);
    return () => browserWindow.removeEventListener("popstate", onPopState);
  }, [deferRouteState, initialState, parseUrl]);

  const navigate = useCallback(
    (newState: T, options?: TOptions & { replace?: boolean | undefined }) => {
      const { window: browserWindow } = globalThis;
      if (!browserWindow) return;

      const target = buildUrl(newState, options);
      const currentUrl =
        browserWindow.location.pathname + browserWindow.location.search;

      if (currentUrl === target) {
        if (!deferRouteState)
          setNavigation({ route: initialState, value: newState });
        return;
      }

      if (canUsePushState(target, options)) {
        const method = options?.replace ? "replaceState" : "pushState";
        browserWindow.history[method](null, "", target);
        // Next commits native-history URLs asynchronously too. Route-owned
        // content must keep its source state until that URL reaches render.
        if (!deferRouteState)
          setNavigation({ route: initialState, value: newState });
      } else if (options?.replace) {
        // Router navigation keeps source state until the destination commits.
        router.replace(target);
      } else {
        router.push(target);
      }
    },
    [buildUrl, canUsePushState, deferRouteState, initialState, router]
  );

  return {
    state,
    navigate,
  };
}
