"use client";

import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";

const subscribers = new Set<() => void>();
let nativeIsActive = true;
let stopListening: (() => void) | undefined;

export function getNativeAppActivity(): boolean {
  return (
    !Capacitor.isNativePlatform() ||
    (nativeIsActive &&
      (typeof document === "undefined" ||
        document.visibilityState !== "hidden"))
  );
}

function notifySubscribers(): void {
  subscribers.forEach((subscriber) => subscriber());
}

function startListening(): () => void {
  let cancelled = false;
  let stateRevision = 0;
  let handle: PluginListenerHandle | undefined;

  const removeListener = async (listener: PluginListenerHandle) => {
    try {
      await listener.remove();
    } catch (cause) {
      console.error("Native app activity listener cleanup failed:", cause);
    }
  };
  const registerListener = async () => {
    try {
      const listener = await App.addListener(
        "appStateChange",
        ({ isActive }) => {
          if (cancelled) return;
          stateRevision += 1;
          nativeIsActive = isActive;
          notifySubscribers();
        }
      );
      if (cancelled) await removeListener(listener);
      else handle = listener;
    } catch (cause) {
      console.error("Native app activity listener setup failed:", cause);
    }
  };
  const readInitialState = async () => {
    try {
      const { isActive } = await App.getState();
      // A newer lifecycle event takes precedence over the initial async read.
      if (cancelled || stateRevision !== 0) return;
      nativeIsActive = isActive;
      notifySubscribers();
    } catch (cause) {
      console.error("Native app activity state read failed:", cause);
    }
  };
  void registerListener();
  void readInitialState();
  if (typeof document !== "undefined")
    document.addEventListener("visibilitychange", notifySubscribers);

  return () => {
    cancelled = true;
    if (typeof document !== "undefined")
      document.removeEventListener("visibilitychange", notifySubscribers);
    if (handle) void removeListener(handle);
    nativeIsActive = true;
  };
}

export function subscribeNativeAppActivity(subscriber: () => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  subscribers.add(subscriber);
  stopListening ??= startListening();

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stopListening?.();
      stopListening = undefined;
    }
  };
}
