"use client";

import { useEffect } from "react";
import type { E2eeEngine, E2eeEngineExt } from "@/lib/e2ee/types";

const canFlush = (
  engine: E2eeEngine
): engine is E2eeEngine & Pick<E2eeEngineExt, "flushReadSync"> =>
  typeof (engine as Partial<E2eeEngineExt>).flushReadSync === "function";

/**
 * Sends read positions still waiting when the page is hidden or unloaded,
 * so your other devices catch up when you switch to them (D175, P60 §4).
 */
export function useE2eeReadSyncFlush(engine: E2eeEngine | null): void {
  useEffect(() => {
    if (!engine || !canFlush(engine)) {
      return;
    }
    const flush = () => {
      engine.flushReadSync().catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    globalThis.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      globalThis.removeEventListener("pagehide", flush);
    };
  }, [engine]);
}
