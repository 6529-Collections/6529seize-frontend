"use client";

import { useState, useEffect } from "react";
import { formatCountdown } from "../utils/timeFormatters";

/**
 * Hook that provides auto-updating countdown text
 * @param targetTime Future timestamp in milliseconds or null
 * @returns Formatted string that updates periodically
 */
export function useCountdown(targetTime: number | null): string {
  // Initialize with current formatted time
  const [display, setDisplay] = useState(() => formatCountdown(targetTime));

  useEffect(() => {
    // Skip if no target time
    if (!targetTime) {
      setDisplay("");
      return;
    }

    // Update the displayed time
    function updateDisplay(): boolean {
      const formatted = formatCountdown(targetTime);
      setDisplay(formatted);

      // Return true if we should continue updating (target not reached)
      return targetTime !== null && Date.now() < targetTime;
    }

    // Determine update frequency based on time remaining
    function getUpdateInterval(): number {
      const timeRemaining = targetTime !== null ? targetTime - Date.now() : 0;

      if (timeRemaining < 60 * 60 * 1000) {
        return 60 * 1000; // 1 minute updates when < 1 hour away
      } else if (timeRemaining < 24 * 60 * 60 * 1000) {
        return 5 * 60 * 1000; // 5 minute updates when < 1 day away
      } else {
        return 60 * 60 * 1000; // 1 hour updates otherwise
      }
    }

    // Initial update
    updateDisplay();

    // Set interval for updates
    const intervalTime = getUpdateInterval();
    const interval = setInterval(() => {
      const shouldContinue = updateDisplay();
      if (!shouldContinue) {
        clearInterval(interval);
      }
    }, intervalTime);

    // Clean up interval on unmount or when targetTime changes
    return () => clearInterval(interval);
  }, [targetTime]);

  return display;
}
