"use client";

import { usePageVisible } from "@/hooks/usePageVisibility";
import { useCallback, useSyncExternalStore } from "react";

const getServerSnapshot = () => 0;

/** Keep mint-day and cutoff labels current without polling subscription data. */
export function useSubscriptionCoverageClock(
  enabled: boolean,
  deadline?: number
): number {
  const visible = usePageVisible();
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled || !visible) return () => undefined;
      let timer: ReturnType<typeof globalThis.setTimeout>;
      const schedule = () => {
        const now = Date.now();
        const nextDay = (Math.floor(now / 86_400_000) + 1) * 86_400_000;
        const cutoff =
          deadline === undefined ? nextDay : Math.ceil(deadline / 1000) * 1000;
        const next = cutoff > now ? Math.min(nextDay, cutoff) : nextDay;
        timer = globalThis.setTimeout(update, Math.max(1, next - now));
      };
      const update = () => {
        globalThis.clearTimeout(timer);
        schedule();
        onChange();
      };
      schedule();
      globalThis.addEventListener("focus", update);
      return () => {
        globalThis.clearTimeout(timer);
        globalThis.removeEventListener("focus", update);
      };
    },
    [enabled, visible, deadline]
  );
  const getSnapshot = useCallback(
    () => (enabled ? Math.floor(Date.now() / 1000) * 1000 : 0),
    [enabled]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
