"use client";

import { useEffect, useReducer } from "react";

import { formatCountdown } from "@/utils/timeFormatters";

/**
 * Hook that provides auto-updating countdown text
 * @param targetTime Future timestamp in milliseconds or null
 * @returns Formatted string that updates periodically
 */
export function useCountdown(targetTime: number | null): string {
  // Use reducer to trigger re-renders; display value is calculated during render
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    // Skip if no target time or already passed
    if (targetTime === null || Date.now() >= targetTime) {
      return;
    }

    // Determine update frequency based on time remaining
    function getUpdateInterval(): number {
      if (targetTime === null) return 0;
      const timeRemaining = targetTime - Date.now();

      if (timeRemaining < 60 * 60 * 1000) {
        return 60 * 1000; // 1 minute updates when < 1 hour away
      }

      if (timeRemaining < 24 * 60 * 60 * 1000) {
        return 5 * 60 * 1000; // 5 minute updates when < 1 day away
      }
      return 60 * 60 * 1000; // 1 hour updates otherwise
    }

    // Set interval for updates
    const intervalTime = getUpdateInterval();
    const interval = setInterval(() => {
      // Stop updating if target reached
      if (Date.now() >= targetTime) {
        clearInterval(interval);
      }
      forceUpdate();
    }, intervalTime);

    // Clean up interval on unmount or when targetTime changes
    return () => clearInterval(interval);
  }, [targetTime]);

  // ✅ Calculate display during rendering (not in effect)
  return formatCountdown(targetTime);
}
