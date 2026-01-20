"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type RefreshCtx = {
  globalRefresh: () => void;
  refreshKey: number;
};

const Ctx = createContext<RefreshCtx | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const globalRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({ globalRefresh, refreshKey }),
    [globalRefresh, refreshKey]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGlobalRefresh() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useGlobalRefresh must be used under <RefreshProvider>");
  }
  return ctx;
}
