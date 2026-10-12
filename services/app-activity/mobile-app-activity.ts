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
  if (Capacitor.isNativePlatform()) return getNativeAppActivity();
  return (
    !getMobileBatterySavings() ||
    typeof document === "undefined" ||
    document.visibilityState !== "hidden"
  );
}

function notifySubscribers(): void {
  subscribers.forEach((subscriber) => subscriber());
}

function listenToActivity(): () => void {
  if (Capacitor.isNativePlatform()) {
    return subscribeNativeAppActivity(notifySubscribers);
  }
  if (typeof document === "undefined") return () => undefined;
  document.addEventListener("visibilitychange", notifySubscribers);
  return () =>
    document.removeEventListener("visibilitychange", notifySubscribers);
}

/** Share one visibility/capability subscription across all mobile consumers. */
export function subscribeMobileAppActivity(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  if (!stopListening) {
    let unsubscribeActivity: (() => void) | undefined;
    const reconcileActivity = () => {
      if (getMobileBatterySavings()) {
        unsubscribeActivity ??= listenToActivity();
      } else {
        unsubscribeActivity?.();
        unsubscribeActivity = undefined;
      }
    };
    reconcileActivity();
    // Retain capability detection so hybrids can enter or leave touch-first mode.
    const unsubscribeCapabilities = subscribeToTouchFirstChanges(() => {
      reconcileActivity();
      notifySubscribers();
    });
    stopListening = () => {
      unsubscribeCapabilities();
      unsubscribeActivity?.();
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
