"use client";

import { usePageVisible } from "@/hooks/usePageVisibility";
import { useCallback, useSyncExternalStore } from "react";

const getServerSnapshot = () => 0;

/** Keep mint-day and cutoff labels current without polling subscription data. */
export function useSubscriptionCoverageClock(enabled: boolean): number {
  const visible = usePageVisible();
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled || !visible) return () => undefined;
      const timer = globalThis.setInterval(onChange, 1000);
      globalThis.addEventListener("focus", onChange);
      return () => {
        globalThis.clearInterval(timer);
        globalThis.removeEventListener("focus", onChange);
      };
    },
    [enabled, visible]
  );
  const getSnapshot = useCallback(
    () => (enabled ? Math.floor(Date.now() / 1000) * 1000 : 0),
    [enabled]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
