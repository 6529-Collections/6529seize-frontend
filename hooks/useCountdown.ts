"use client";

import { useEffect, useReducer } from "react";
import {
  formatCountdown,
  formatCountdownAdaptive,
} from "@/utils/timeFormatters";

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

/**
 * Hook that provides adaptive countdown display
 * - > 1 day: "2d 14h" (updates every minute)
 * - < 1 day: "05:30:45" (updates every second)
 * @param targetTimestampSeconds Future timestamp in SECONDS (Unix timestamp)
 * @returns Formatted string that updates appropriately
 */
export function useCountdownAdaptive(targetTimestampSeconds: number): string {
  // Use reducer to trigger re-renders; display value is calculated during render
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const targetMs = targetTimestampSeconds * 1000;

    // Determine if we need per-second updates
    const getInterval = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) return null; // Stop updating
      if (diff < 24 * 60 * 60 * 1000) return 1000; // < 1 day: every second
      return 60 * 1000; // > 1 day: every minute
    };

    const intervalMs = getInterval();
    if (intervalMs === null) return;

    const interval = setInterval(() => {
      forceUpdate();
      // Check if we need to switch to per-second updates
      const newInterval = getInterval();
      if (newInterval !== intervalMs) {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [targetTimestampSeconds]);

  // ✅ Calculate display during rendering (not in effect)
  return formatCountdownAdaptive(targetTimestampSeconds);
}
