"use client";

import { useSyncExternalStore } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { isWaveChatPathname } from "@/helpers/navigation.helpers";

const subscribe = () => () => undefined;
const getSnapshot = () => true;

// Server-only. Public routes skip `useSearchParams()` because they can
// prerender without a request, where a call outside Suspense fails the build.
// A server render runs once per request with a fixed pathname, so the call
// order cannot change between renders of one component instance, and there
// is nothing for the compiler to memoize. The browser variant below calls it
// unconditionally.
/* eslint-disable react-hooks/rules-of-hooks, react-compiler/react-compiler -- server-only conditional hook, see above */
function useServerShellSearchParams(
  pathname: string | null
): ReadonlyURLSearchParams | null {
  if (!isWaveChatPathname(pathname)) return null;
  return useSearchParams();
}
/* eslint-enable react-hooks/rules-of-hooks, react-compiler/react-compiler */

function useBrowserShellSearchParams(
  pathname: string | null
): ReadonlyURLSearchParams | null {
  const searchParams = useSearchParams();
  const readsDuringHydration = isWaveChatPathname(pathname);
  // Matches the server: public routes hide the query only in the hydration
  // render; every later render, on every route, reads the live query.
  const canRead = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => readsDuringHydration
  );
  return canRead ? searchParams : null;
}

/**
 * Search params for the providers that wrap every route (`MyStreamProvider`,
 * `WaveInformationProvider`). Wave and chat routes read the query in render,
 * as before. Other routes see `null` in the server HTML and its hydration
 * render, then the live query from the next render on.
 */
export const useShellSearchParams =
  typeof window === "undefined"
    ? useServerShellSearchParams
    : useBrowserShellSearchParams;
