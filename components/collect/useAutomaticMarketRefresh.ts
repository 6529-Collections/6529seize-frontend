"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";

const BROWSING_INTERVAL_MS = 60_000;
const BROWSING_TIMEOUT_MS = 30_000;

/** Browsing reads never grant execution authority or replace an active intent. */
export function useAutomaticMarketRefresh(
  enabled: boolean,
  refresh: (signal: AbortSignal) => Promise<void>
) {
  const pending = useRef<AbortController | null>(null);
  // Invalidate an in-flight read as soon as a selection/actor change commits.
  useLayoutEffect(() => () => pending.current?.abort(), [enabled, refresh]);
  useEffect(() => {
    if (!enabled) return;
    let lastAttempt = Date.now();
    const update = () => {
      if (
        document.visibilityState !== "visible" ||
        pending.current ||
        Date.now() - lastAttempt < BROWSING_INTERVAL_MS
      )
        return;
      lastAttempt = Date.now();
      const controller = new AbortController();
      pending.current = controller;
      const deadline = createFetchDeadline(
        controller.signal,
        BROWSING_TIMEOUT_MS,
        () => new Error("Market browsing update timed out")
      );
      void deadline
        .run(() => refresh(deadline.signal))
        .catch(() => undefined)
        .finally(() => {
          deadline.dispose();
          if (pending.current === controller) pending.current = null;
        });
    };
    const interval = globalThis.setInterval(update, BROWSING_INTERVAL_MS);
    globalThis.addEventListener("focus", update);
    globalThis.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      globalThis.clearInterval(interval);
      globalThis.removeEventListener("focus", update);
      globalThis.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
      pending.current?.abort();
      pending.current = null;
    };
  }, [enabled, refresh]);
}
