"use client";

import { useSyncExternalStore } from "react";

// Network Information API (Chromium, including Android WebView). Safari and
// Firefox do not expose it, so they are never treated as constrained.
interface NetworkInformationLike extends EventTarget {
  readonly saveData?: boolean;
  readonly type?: string;
  readonly effectiveType?: string;
}

const SLOW_EFFECTIVE_TYPES = new Set(["slow-2g", "2g", "3g"]);

const getConnection = (): NetworkInformationLike | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
};

/**
 * True when the visitor asked to save data, is on a cellular connection, or
 * the connection is effectively 3G or slower.
 */
const isConstrainedNetwork = (): boolean => {
  const connection = getConnection();
  if (!connection) {
    return false;
  }
  return (
    connection.saveData === true ||
    connection.type === "cellular" ||
    SLOW_EFFECTIVE_TYPES.has(connection.effectiveType ?? "")
  );
};

const subscribe = (onStoreChange: () => void) => {
  const connection = getConnection();
  if (typeof connection?.addEventListener !== "function") {
    return () => undefined;
  }
  connection.addEventListener("change", onStoreChange);
  return () => connection.removeEventListener("change", onStoreChange);
};

export default function useIsConstrainedNetwork(): boolean {
  return useSyncExternalStore(subscribe, isConstrainedNetwork, () => false);
}
