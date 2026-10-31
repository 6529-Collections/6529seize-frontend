"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type {
  StreamActions,
  StreamDataSource,
  StreamDevControls,
} from "@/lib/stream/dataSource";
import { createMockStream, MOCK_ACCOUNTS } from "@/lib/stream/mock";
import type { Address } from "@/lib/stream/types";

/**
 * The section's data context. Today it holds the mock; the chain swap replaces
 * `createBrowserStream` and nothing else (see `lib/stream/README.md`).
 */

interface StreamClient {
  readonly dataSource: StreamDataSource;
  readonly actions: StreamActions;
  /** Mock-only: the simulated clock, accounts and network actors. Null on chain. */
  readonly dev: StreamDevControls | null;
}

let browserStream: StreamClient | null = null;

/** One world per browser tab, kept across client-side navigation. */
function createBrowserStream(): StreamClient {
  if (browserStream === null) {
    const mock = createMockStream();
    browserStream = {
      dataSource: mock.dataSource,
      actions: mock.actions,
      dev: mock.dev,
    };
  }
  return browserStream;
}

const subscribeNever = () => () => undefined;
const getServerStream = () => null;

interface StreamContextValue {
  readonly client: StreamClient | null;
  /** The connected account; in the mock, the dev panel's account switcher. */
  readonly account: Address | null;
  readonly setAccount: (account: Address | null) => void;
}

const StreamContext = createContext<StreamContextValue | null>(null);

export function StreamProvider({ children }: { readonly children: ReactNode }) {
  // Null while rendering on the server and hydrating; the client then builds
  // the world, so server HTML never depends on the simulated clock.
  const client = useSyncExternalStore(
    subscribeNever,
    createBrowserStream,
    getServerStream
  );
  const [account, setAccount] = useState<Address | null>(
    MOCK_ACCOUNTS.collectorA
  );
  const value = useMemo(
    () => ({ client, account, setAccount }),
    [client, account]
  );
  return (
    <StreamContext.Provider value={value}>{children}</StreamContext.Provider>
  );
}

export function useStream(): StreamContextValue {
  const value = useContext(StreamContext);
  if (value === null) {
    throw new Error("useStream must be used inside StreamProvider");
  }
  return value;
}

const noop = () => undefined;
const zero = () => 0;

/** Re-renders on every data change and every simulated second. */
function useRevision(dataSource: StreamDataSource | null): string {
  const subscribe = useCallback(
    (listener: () => void) =>
      dataSource === null ? noop : dataSource.subscribe(listener),
    [dataSource]
  );
  const getVersion = useCallback(
    () => (dataSource === null ? 0 : dataSource.version()),
    [dataSource]
  );
  const version = useSyncExternalStore(subscribe, getVersion, zero);
  const now = useStreamNow();
  return `${version}:${now}`;
}

const tickListeners = new Set<() => void>();
let tickTimer: ReturnType<typeof setInterval> | null = null;

function subscribeTick(listener: () => void): () => void {
  tickListeners.add(listener);
  tickTimer ??= setInterval(() => {
    tickListeners.forEach((notify) => notify());
  }, 1_000);
  return () => {
    tickListeners.delete(listener);
    if (tickListeners.size === 0 && tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

/** The data's "now" in Unix seconds (simulated in the mock), ticking each second; 0 before hydration. */
export function useStreamNow(): number {
  const { client } = useStream();
  const getNow = useCallback(() => client?.dataSource.now() ?? 0, [client]);
  return useSyncExternalStore(subscribeTick, getNow, zero);
}

/**
 * Reads through the data source with React Query. `key` and `args` identify
 * the read (strings and numbers only); the revision refetches it whenever the
 * data or the simulated time changes.
 */
export function useStreamQuery<T>(
  key: string,
  args: readonly (string | number | boolean | null)[],
  read: (dataSource: StreamDataSource) => Promise<T>
) {
  const { client } = useStream();
  const dataSource = client?.dataSource ?? null;
  const revision = useRevision(dataSource);
  return useQuery({
    queryKey: [QueryKey.STREAM_DATA, key, ...args, revision],
    queryFn: () => {
      if (dataSource === null) {
        throw new Error("stream data source not ready");
      }
      return read(dataSource);
    },
    enabled: dataSource !== null,
    placeholderData: keepPreviousData,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 30_000,
    retry: false,
  });
}
