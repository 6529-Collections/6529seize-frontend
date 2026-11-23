"use client";

import { useSyncExternalStore } from "react";

/**
 * The time the identity page judges waits and expiries by, as a store: read
 * during render without calling the clock there, and moved on every 15
 * seconds while anything shows it, and whenever something starts showing it.
 */
const TICK_MS = 15_000;

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

const tick = () => {
  now = Date.now();
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  tick();
  timer ??= setInterval(tick, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
};

/**
 * The stored time; when nothing has kept it moving (no view subscribed), it
 * is brought up to date first, so a view coming back never paints with a
 * time from before it left.
 */
const snapshot = () => {
  if (timer === null && Date.now() - now > TICK_MS) {
    now = Date.now();
  }
  return now;
};

/** The current time in ms, updated while the page is open. */
export function useChainClock(): number {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
