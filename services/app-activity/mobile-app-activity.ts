"use client";

import { Capacitor } from "@capacitor/core";
import {
  isTouchFirstEnvironment,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";
import {
  getNativeAppActivity,
  subscribeNativeAppActivity,
} from "./native-app-activity";

const subscribers = new Set<() => void>();
let stopListening: (() => void) | undefined;

/** Apply the media loading policy to native apps and touch-first browsers. */
export function getMobileBatterySavings(): boolean {
  return Capacitor.isNativePlatform() || isTouchFirstEnvironment();
}

export function getMobileAppActivity(): boolean {
  return (
    !getMobileBatterySavings() ||
    (getNativeAppActivity() &&
      (typeof document === "undefined" ||
        document.visibilityState !== "hidden"))
  );
}

function notifySubscribers(): void {
  subscribers.forEach((subscriber) => subscriber());
}

/** Share one visibility/capability subscription across all mobile consumers. */
export function subscribeMobileAppActivity(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  if (!stopListening) {
    const unsubscribeNative = subscribeNativeAppActivity(notifySubscribers);
    const unsubscribeCapabilities =
      subscribeToTouchFirstChanges(notifySubscribers);
    if (typeof document !== "undefined")
      document.addEventListener("visibilitychange", notifySubscribers);
    stopListening = () => {
      unsubscribeNative();
      unsubscribeCapabilities();
      if (typeof document !== "undefined")
        document.removeEventListener("visibilitychange", notifySubscribers);
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
