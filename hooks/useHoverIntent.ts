"use client";

import { useCallback, useEffect, useRef } from "react";

const HOVER_INTENT_DELAY_MS = 150;

/**
 * Runs an action only after the pointer has rested on a target for a short
 * moment, so sweeping the cursor across a list does not fire a request per
 * row. Scheduling again, calling `cancel` (for example on mouse leave) or
 * unmounting drops the pending action.
 */
export function useHoverIntent(delayMs: number = HOVER_INTENT_DELAY_MS) {
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null
  );

  const cancel = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }

    globalThis.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const schedule = useCallback(
    (action: () => void) => {
      cancel();
      timerRef.current = globalThis.setTimeout(() => {
        timerRef.current = null;
        action();
      }, delayMs);
    },
    [cancel, delayMs]
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}
