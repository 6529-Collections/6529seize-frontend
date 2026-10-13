"use client";

import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribe(onChange: () => void): () => void {
  const interval = setInterval(onChange, MINUTE_MS);
  globalThis.addEventListener("focus", onChange);
  return () => {
    clearInterval(interval);
    globalThis.removeEventListener("focus", onChange);
  };
}

const getSnapshot = (): number =>
  Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;

const getServerSnapshot = (): number => 0;

/** The current time rounded down to the minute; 0 during server rendering. */
export const useMinuteClock = (): number =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
