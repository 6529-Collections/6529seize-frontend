"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * The World (EXPLAINED.md §8.1): one state per chapter that every model on
 * the page reads and writes, so views stay linked: the clock moves every
 * figure at once; a wallet added in one model is there in the next. A
 * constructed world can be shared in the URL (`?w=`); a world that holds a
 * real wallet never is: `share` returns null for it.
 */
export interface WorldState {
  /** The cycle on the clock. */
  readonly cycle: number;
  readonly [key: string]: unknown;
}

interface WorldContextValue {
  readonly state: WorldState;
  readonly set: (next: Partial<WorldState>) => void;
}

const WorldContext = createContext<WorldContextValue | null>(null);

const PARAM = "w";

function encode(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(Array.from(bytes, (byte) => String.fromCodePoint(byte)).join(""));
}

function decode(text: string): unknown {
  try {
    const bytes = Uint8Array.from(
      atob(text),
      (char) => char.codePointAt(0) ?? 0
    );
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

export function World({
  initial,
  children,
  share,
  parse,
  link,
}: {
  readonly initial: WorldState;
  readonly children: ReactNode;
  /** The part of the state a link may carry; null when it must not (a real wallet). */
  readonly share?: (state: WorldState) => Record<string, unknown> | null;
  /** Reads a shared state back, rejecting anything it does not recognise. */
  readonly parse?: (value: unknown) => Partial<WorldState> | null;
  /** The page's `?w=` value, read on the server so both renders start alike. */
  readonly link?: string | null;
}) {
  const [state, setState] = useState<WorldState>(() => {
    const parsed = parse && link ? parse(decode(link)) : null;
    return parsed ? { ...initial, ...parsed } : initial;
  });

  // The link this state may travel in: undefined when the page does not share.
  let nextLink: string | null | undefined;
  if (share) {
    const shared = share(state);
    nextLink = shared === null ? null : encode(shared);
  }
  useEffect(() => {
    if (nextLink === undefined) return;
    const url = new URL(globalThis.location.href);
    if (nextLink === null) url.searchParams.delete(PARAM);
    else url.searchParams.set(PARAM, nextLink);
    globalThis.history.replaceState(globalThis.history.state, "", url);
  }, [nextLink]);

  const set = useCallback((next: Partial<WorldState>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);
  const value = useMemo(() => ({ state, set }), [state, set]);
  return (
    <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
  );
}

/** The chapter's world, read and written by any model inside it. */
export function useWorld(): WorldContextValue {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error("useWorld needs a World above it.");
  }
  return context;
}

export { decode as decodeWorld, encode as encodeWorld };
