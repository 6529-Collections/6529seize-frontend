"use client";

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import {
  getNativeAppActivity,
  subscribeNativeAppActivity,
} from "@/services/app-activity/native-app-activity";

// Clock-driven UI (countdowns, "time left", relative times) only needs to
// update while someone can see it. One shared visibility subscription serves
// every consumer; in the native app an inactive app also counts as hidden.

const subscribers = new Set<() => void>();
let stopListening: (() => void) | undefined;

function getPageVisible(): boolean {
  return (
    (typeof document === "undefined" ||
      document.visibilityState !== "hidden") &&
    getNativeAppActivity()
  );
}

// Server renders and hydration treat the page as visible. If the page is
// hidden while it hydrates (for example a link opened in a background tab),
// useSyncExternalStore re-renders with the client value right after
// hydration; useVisibleInterval reads the client value directly.
const getServerPageVisible = () => true;

function notifySubscribers(): void {
  // Iterate a snapshot so a callback that adds or removes subscribers cannot
  // change this pass, and skip any removed meanwhile: a removed callback
  // belongs to a cleaned-up consumer and must not restart its timer.
  for (const subscriber of [...subscribers]) {
    if (subscribers.has(subscriber)) {
      subscriber();
    }
  }
}

function subscribePageVisibility(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  if (!stopListening && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", notifySubscribers);
    const stopNativeActivity = subscribeNativeAppActivity(notifySubscribers);
    stopListening = () => {
      document.removeEventListener("visibilitychange", notifySubscribers);
      stopNativeActivity();
    };
  }
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stopListening?.();
      stopListening = undefined;
    }
  };
}

/** Whether the page is shown (and, in the native app, the app is active). */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribePageVisibility,
    getPageVisible,
    getServerPageVisible
  );
}

/**
 * Calls `callback` every `delayMs` while the page is visible. The interval
 * stops while the page is hidden; when it is shown again `callback` runs once
 * immediately so clock-derived values catch up, and the cadence restarts
 * from there. Pass `null` to stop. `callback` always sees the latest render.
 */
export function useVisibleInterval(
  callback: () => void,
  delayMs: number | null
): void {
  const onTick = useEffectEvent(callback);

  useEffect(() => {
    if (delayMs === null) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearInterval(intervalId);
      intervalId = undefined;
    };
    const start = () => {
      intervalId = setInterval(() => onTick(), delayMs);
    };
    const syncWithVisibility = () => {
      if (!getPageVisible()) {
        stop();
      } else if (intervalId === undefined) {
        onTick();
        start();
      }
    };

    if (getPageVisible()) {
      start();
    }
    const unsubscribe = subscribePageVisibility(syncWithVisibility);
    return () => {
      unsubscribe();
      stop();
    };
  }, [delayMs]);
}
