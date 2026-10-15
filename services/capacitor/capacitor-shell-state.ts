"use client";

import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";

/**
 * Shared native-shell state behind `useCapacitor`.
 *
 * Every `useCapacitor` consumer used to run its own `App.getState()` read plus
 * `appStateChange` and `orientationchange` listeners, so the cost multiplied
 * with the number of mounted chat rows. These stores keep ONE of each for the
 * whole app: the first subscriber starts them, the last one to leave tears them
 * down (after a microtask, so rows swapped in one commit keep the session), and
 * they never start outside a native shell.
 */

const ORIENTATION_PORTRAIT_QUERY = "(orientation: portrait)";

/**
 * Builds a `subscribe` function for `useSyncExternalStore` that starts
 * `start` for the first subscriber and runs its teardown once the last one has
 * left. Teardown waits a microtask: React runs a commit's unsubscribes before
 * its subscribes, so a row replaced by another in the same commit momentarily
 * leaves zero subscribers and must not restart the native session.
 */
function createSharedSubscribe(
  start: (notify: () => void) => () => void
): (onChange: () => void) => () => void {
  const subscriptions = new Set<() => void>();
  let stop: (() => void) | undefined;

  const notify = () => {
    for (const subscription of subscriptions) {
      subscription();
    }
  };
  const stopWhenUnused = () => {
    if (subscriptions.size === 0) {
      stop?.();
      stop = undefined;
    }
  };

  return (onChange) => {
    if (!Capacitor.isNativePlatform()) {
      return () => undefined;
    }

    // A wrapper per subscription keeps repeated subscriptions of the same
    // callback independent instead of collapsing into one Set entry.
    const subscription = () => onChange();
    subscriptions.add(subscription);
    stop ??= start(notify);

    return () => {
      subscriptions.delete(subscription);
      if (subscriptions.size === 0) {
        void Promise.resolve().then(stopWhenUnused);
      }
    };
  };
}

let appIsActive = false;

/** Whether the native app is in the foreground (`false` until first known). */
export const getCapacitorAppActive = (): boolean => appIsActive;

export const subscribeCapacitorAppState = createSharedSubscribe((notify) => {
  let cancelled = false;
  let receivedStateChange = false;
  let handle: PluginListenerHandle | undefined;

  const setActive = (isActive: boolean) => {
    if (appIsActive === isActive) {
      return;
    }
    appIsActive = isActive;
    notify();
  };
  const removeHandle = async (listener: PluginListenerHandle) => {
    try {
      await listener.remove();
    } catch (error) {
      console.error("Capacitor app state listener cleanup error:", error);
    }
  };
  const listen = async () => {
    try {
      const listener = await App.addListener("appStateChange", (state) => {
        if (cancelled) {
          return;
        }
        receivedStateChange = true;
        setActive(state.isActive);
      });
      if (cancelled) {
        await removeHandle(listener);
      } else {
        handle = listener;
      }
    } catch (error) {
      console.error("Capacitor app state listener error:", error);
    }
  };
  const readInitialState = async () => {
    try {
      const state = await App.getState();
      // A lifecycle event that arrived first is newer than this read.
      if (!cancelled && !receivedStateChange) {
        setActive(state.isActive);
      }
    } catch (error) {
      console.error("Capacitor app state error:", error);
    }
  };

  void listen();
  void readInitialState();

  return () => {
    cancelled = true;
    // The last known state is kept: the next session re-reads the real value,
    // and consumers that remount meanwhile never flash inactive.
    if (handle) {
      void removeHandle(handle);
    }
  };
});

const readIsPortrait = (): boolean => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return true;
  }

  return window.matchMedia(ORIENTATION_PORTRAIT_QUERY).matches;
};

// Kept current by `orientationchange` while subscribed.
let sharedIsPortrait: boolean | undefined;
// Reads made before the first subscription (every consumer of an initial mount
// renders first) share one `matchMedia` lookup per tick instead of one each.
let tickIsPortrait: boolean | undefined;

/** Whether the native shell is in portrait (always `true` outside native). */
export const getCapacitorIsPortrait = (): boolean => {
  if (sharedIsPortrait !== undefined) {
    return sharedIsPortrait;
  }
  if (!Capacitor.isNativePlatform()) {
    return true;
  }
  if (tickIsPortrait === undefined) {
    tickIsPortrait = readIsPortrait();
    void Promise.resolve().then(() => {
      tickIsPortrait = undefined;
    });
  }
  return tickIsPortrait;
};

export const subscribeCapacitorOrientation = createSharedSubscribe((notify) => {
  sharedIsPortrait = readIsPortrait();

  const handleOrientationChange = () => {
    const nextIsPortrait = readIsPortrait();
    if (nextIsPortrait === sharedIsPortrait) {
      return;
    }
    sharedIsPortrait = nextIsPortrait;
    notify();
  };

  window.addEventListener("orientationchange", handleOrientationChange);

  return () => {
    window.removeEventListener("orientationchange", handleOrientationChange);
    sharedIsPortrait = undefined;
  };
});
