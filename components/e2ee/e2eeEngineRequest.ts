"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Pages outside `/messages/encrypted` that need the encrypted-messages
 * engine while they are open (Devices & security). A count, not an event,
 * so a request made before the provider subscribes (a child effect runs
 * before its ancestors') is never lost.
 */
let requests = 0;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Keeps the engine requested while the calling component is mounted. */
export function useRequestE2eeEngine(enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    requests += 1;
    notify();
    return () => {
      requests -= 1;
      notify();
    };
  }, [enabled]);
}

/** True while any mounted page asks for the engine. */
export function useE2eeEngineRequested(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => requests > 0,
    () => false
  );
}
