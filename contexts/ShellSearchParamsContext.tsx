"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { isWaveChatPathname } from "@/helpers/navigation.helpers";

// Search params for the providers that wrap every route (`MyStreamProvider`,
// `WaveInformationProvider`). Wave and chat routes render per request and read
// the query in render, on the server and in the browser, as before. Every other
// route can prerender without a request: there these providers see no query in
// the server HTML and its hydration render, and the live query from the next
// render on.

const ServerSearchParamsContext = createContext<ReadonlyURLSearchParams | null>(
  null
);

function WaveChatServerSearchParams({
  children,
}: {
  readonly children: ReactNode;
}) {
  const searchParams = useSearchParams();
  return (
    <ServerSearchParamsContext.Provider value={searchParams}>
      {children}
    </ServerSearchParamsContext.Provider>
  );
}

// A server render runs once per request, so choosing the subtree by pathname
// never swaps it under a mounted tree. Public routes never call
// `useSearchParams()`, which outside Suspense would fail their prerender.
function ServerShellSearchParamsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  if (!isWaveChatPathname(pathname)) return children;
  return <WaveChatServerSearchParams>{children}</WaveChatServerSearchParams>;
}

// The browser reads the query in each provider (below); nothing to provide.
function BrowserShellSearchParamsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}

/** Mount above `MyStreamProvider` and `WaveInformationProvider`. */
export const ShellSearchParamsProvider =
  typeof window === "undefined"
    ? ServerShellSearchParamsProvider
    : BrowserShellSearchParamsProvider;

function useServerShellSearchParams(
  _pathname: string | null
): ReadonlyURLSearchParams | null {
  return useContext(ServerSearchParamsContext);
}

const subscribe = () => () => undefined;
const getSnapshot = () => true;

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

export const useShellSearchParams =
  typeof window === "undefined"
    ? useServerShellSearchParams
    : useBrowserShellSearchParams;
