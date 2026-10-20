"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

const subscribeToMinutes = (onChange: () => void) => {
  const timer = globalThis.setInterval(onChange, MINUTE_MS);
  return () => globalThis.clearInterval(timer);
};

const getMinuteSnapshot = () => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
const getServerSnapshot = () => 0;

/**
 * Current time rounded to the minute, refreshed every minute. Keeps render
 * pure for expiry checks (device grants, renewal window).
 */
export function useE2eeNow(): number {
  return useSyncExternalStore(
    subscribeToMinutes,
    getMinuteSnapshot,
    getServerSnapshot
  );
}
