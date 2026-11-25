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
}

const HISTORY_KEY = "waveChatUnreadDivider";
const HISTORY_CHANGE_EVENT = "wave-chat-unread-divider-change";

// React uses this same snapshot for server rendering and client hydration.
const getServerDivider = () => undefined;
const subscribeWithoutHistory = () => () => {};

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
  serialNo: number | null
) {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (
    getActiveWaveIdFromUrl({
      pathname,
      searchParams: new URLSearchParams(search),
    }) !== waveId ||
    readDividerHistory(waveId, viewerKey) === serialNo
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
  const [localDivider, setLocalDivider] = useState<number | null | undefined>(
    () => initialSerialNo ?? undefined
  );
  const waveId = historyScope?.waveId;
  const viewerKey = historyScope?.viewerKey;
  const hasHistoryScope = waveId !== undefined && viewerKey !== undefined;
  const getHistoryDivider = useCallback(
    () => (hasHistoryScope ? readDividerHistory(waveId, viewerKey) : undefined),
    [hasHistoryScope, viewerKey, waveId]
  );
  const historyDivider = useSyncExternalStore(
    hasHistoryScope ? subscribeToDividerHistory : subscribeWithoutHistory,
    getHistoryDivider,
    getServerDivider
  );
  const savedDivider = hasHistoryScope ? historyDivider : localDivider;
  // Undefined means no position has arrived. Null means the reader cleared it.
  const unreadDividerSerialNo =
    savedDivider === undefined ? initialSerialNo : savedDivider;

  useLayoutEffect(() => {
    if (initialSerialNo === null) return;
    if (!hasHistoryScope) {
      setLocalDivider((previous) =>
        previous === undefined ? initialSerialNo : previous
      );
      return;
    }
    if (getHistoryDivider() === undefined) {
      rememberDividerHistory(waveId, viewerKey, initialSerialNo);
    }
  }, [getHistoryDivider, hasHistoryScope, initialSerialNo, viewerKey, waveId]);

  const isMountedRef = useRef(false);
  useLayoutEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setUnreadDividerSerialNo = useCallback<SetUnreadDividerSerialNo>(
    (value) => {
      const resolve = (current: number | null | undefined) => {
        if (typeof value !== "function") return value;
        return value(current === undefined ? initialSerialNo : current);
      };
      if (!hasHistoryScope) {
        setLocalDivider(resolve);
        return;
      }
      // An async drop action can finish after navigation or while Chat is hidden.
      if (!isMountedRef.current) return;
      rememberDividerHistory(waveId, viewerKey, resolve(getHistoryDivider()));
    },
    [getHistoryDivider, hasHistoryScope, initialSerialNo, viewerKey, waveId]
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
