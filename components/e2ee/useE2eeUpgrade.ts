"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { E2eeEngine } from "@/lib/e2ee/types";

const getNoUpgrade = (): number | null => null;

/**
 * The number of read-only conversations kept while this device moved off an
 * earlier encryption suite and has not enrolled again (D172), else null.
 * Setup then shows upgrade copy instead of first-time copy.
 */
export function useE2eeUpgradeCount(engine: E2eeEngine | null): number | null {
  const subscribe = useCallback(
    (listener: () => void) =>
      engine ? engine.subscribe(listener) : () => undefined,
    [engine]
  );
  const getCount = useCallback(
    () => engine?.getUpgrade()?.superseded ?? null,
    [engine]
  );
  return useSyncExternalStore(subscribe, getCount, getNoUpgrade);
}
