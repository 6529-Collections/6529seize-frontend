"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

type SetUnreadDividerSerialNo = (
  serialNo: number | null | ((current: number | null) => number | null)
) => void;

interface UnreadDividerContextValue {
  unreadDividerSerialNo: number | null;
  setUnreadDividerSerialNo: SetUnreadDividerSerialNo;
}

const UnreadDividerContext = createContext<UnreadDividerContextValue | null>(
  null
);

interface UnreadDividerHistoryScope {
  readonly waveId: string;
  readonly viewerKey: string;
  readonly entryUrl: string;
}

const HISTORY_KEY = "waveChatUnreadDivider";
const HISTORY_CHANGE_EVENT = "wave-chat-unread-divider-change";

// Wait for the browser's visit state before showing a divider during hydration.
const getServerDivider = () => undefined;

function createLocalDividerStore() {
  let serialNo: number | null | undefined;
  const listeners = new Set<() => void>();
  return {
    get: () => serialNo,
    set(nextSerialNo: number | null) {
      if (serialNo === nextSerialNo) return;
      serialNo = nextSerialNo;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function subscribeToDividerHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(HISTORY_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(HISTORY_CHANGE_EVENT, onChange);
  };
}

function readDividerHistory(waveId: string, viewerKey: string) {
  if (typeof window === "undefined") return undefined;
  const state: unknown = window.history.state;
  if (state === null || typeof state !== "object" || !(HISTORY_KEY in state)) {
    return undefined;
  }
  const saved = state[HISTORY_KEY];
  if (
    saved === null ||
    typeof saved !== "object" ||
    !("waveId" in saved) ||
    saved.waveId !== waveId ||
    !("viewerKey" in saved) ||
    saved.viewerKey !== viewerKey ||
    !("serialNo" in saved)
  ) {
    return undefined;
  }
  const serialNo = saved.serialNo;
  if (serialNo === null) return null;
  return typeof serialNo === "number" &&
    Number.isSafeInteger(serialNo) &&
    serialNo > 0
    ? serialNo
    : undefined;
}

function rememberDividerHistory(
  waveId: string,
  viewerKey: string,
  entryUrl: string,
  serialNo: number | null
) {
  if (
    typeof window === "undefined" ||
    readDividerHistory(waveId, viewerKey) === serialNo
  ) {
    return;
  }
  const { pathname, search } = window.location;
  const searchParams = new URLSearchParams(search);
  if (
    `${pathname}?${searchParams.toString()}` !== entryUrl ||
    getActiveWaveIdFromUrl({ pathname, searchParams }) !== waveId
  ) {
    return;
  }
  window.history.replaceState(
    { ...window.history.state, [HISTORY_KEY]: { waveId, viewerKey, serialNo } },
    ""
  );
  window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
}

interface UnreadDividerProviderProps {
  readonly initialSerialNo: number | null;
  readonly historyScope?: UnreadDividerHistoryScope | undefined;
  readonly children: ReactNode;
}

export function UnreadDividerProvider({
  initialSerialNo,
  historyScope,
  children,
}: UnreadDividerProviderProps) {
  // Chat activity retains this store when only the selected wave view changes.
  const [localStore] = useState(createLocalDividerStore);
  const waveId = historyScope?.waveId;
  const viewerKey = historyScope?.viewerKey;
  const entryUrl = historyScope?.entryUrl;
  const hasHistoryScope =
    waveId !== undefined && viewerKey !== undefined && entryUrl !== undefined;
  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribeLocal = localStore.subscribe(onChange);
      if (!hasHistoryScope) return unsubscribeLocal;
      const unsubscribeHistory = subscribeToDividerHistory(onChange);
      return () => {
        unsubscribeLocal();
        unsubscribeHistory();
      };
    },
    [hasHistoryScope, localStore]
  );
  const getHistoryDivider = useCallback(
    () => (hasHistoryScope ? readDividerHistory(waveId, viewerKey) : undefined),
    [hasHistoryScope, viewerKey, waveId]
  );
  const getDivider = useCallback(() => {
    const historyDivider = getHistoryDivider();
    // The active entry wins, including an explicit dismissal. The retained
    // chat supplies the value if a same-wave router write dropped custom state.
    return historyDivider === undefined ? localStore.get() : historyDivider;
  }, [getHistoryDivider, localStore]);
  const savedDivider = useSyncExternalStore(
    subscribe,
    getDivider,
    getServerDivider
  );
  // Undefined means no position has arrived. Null means the reader cleared it.
  const unreadDividerSerialNo = savedDivider ?? null;

  const rememberDivider = useCallback(
    (serialNo: number | null) => {
      localStore.set(serialNo);
      if (hasHistoryScope) {
        rememberDividerHistory(waveId, viewerKey, entryUrl, serialNo);
      }
    },
    [entryUrl, hasHistoryScope, localStore, viewerKey, waveId]
  );

  const isMountedRef = useRef(false);
  useLayoutEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    // Check after each commit because a same-URL router write can drop the key
    // without changing the route props or the retained divider snapshot.
    const historyDivider = getHistoryDivider();
    if (historyDivider !== undefined) {
      localStore.set(historyDivider);
      return;
    }
    const retainedDivider = localStore.get();
    if (retainedDivider !== undefined) {
      if (hasHistoryScope) {
        rememberDividerHistory(waveId, viewerKey, entryUrl, retainedDivider);
      }
      return;
    }
    if (initialSerialNo !== null) {
      rememberDivider(initialSerialNo);
    }
  });

  const setUnreadDividerSerialNo = useCallback<SetUnreadDividerSerialNo>(
    (value) => {
      // An async drop action can finish after navigation or while Chat is hidden.
      if (!isMountedRef.current) return;
      if (typeof value !== "function") {
        rememberDivider(value);
        return;
      }
      const previous = getDivider();
      rememberDivider(value(previous === undefined ? initialSerialNo : previous));
    },
    [getDivider, initialSerialNo, rememberDivider]
  );

  const value = useMemo(
    () => ({
      unreadDividerSerialNo,
      setUnreadDividerSerialNo,
    }),
    [unreadDividerSerialNo, setUnreadDividerSerialNo]
  );

  return (
    <UnreadDividerContext.Provider value={value}>
      {children}
    </UnreadDividerContext.Provider>
  );
}

export function useUnreadDivider() {
  const context = useContext(UnreadDividerContext);
  if (!context) {
    throw new Error(
      "useUnreadDivider must be used within an UnreadDividerProvider"
    );
  }
  return context;
}

export function useUnreadDividerOptional() {
  return useContext(UnreadDividerContext);
}
