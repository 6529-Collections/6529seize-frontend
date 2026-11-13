"use client";

import { Capacitor } from "@capacitor/core";
import { useSyncExternalStore } from "react";
import {
  getCapacitorAppActive,
  getCapacitorIsPortrait,
  subscribeCapacitorAppState,
  subscribeCapacitorOrientation,
} from "@/services/capacitor/capacitor-shell-state";

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

// Server and hydration renders match the web defaults: inactive, portrait.
const getServerAppActive = () => false;
const getServerIsPortrait = () => true;

enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

const useCapacitor = () => {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const isCapacitor = isHydrated && Capacitor.isNativePlatform();
  const platform = isHydrated ? Capacitor.getPlatform() : "web";

  const isIos = platform === "ios";
  const isAndroid = platform === "android";

  // App state and orientation come from app-wide shared stores, so mounting
  // many consumers (one per chat row) adds no native calls or listeners.
  const isActive = useSyncExternalStore(
    subscribeCapacitorAppState,
    getCapacitorAppActive,
    getServerAppActive
  );
  const isPortrait = useSyncExternalStore(
    subscribeCapacitorOrientation,
    getCapacitorIsPortrait,
    getServerIsPortrait
  );

  return {
    isCapacitor,
    platform,
    isIos,
    isAndroid,
    orientation: isPortrait
      ? CapacitorOrientationType.PORTRAIT
      : CapacitorOrientationType.LANDSCAPE,
    isActive,
  };
};

export default useCapacitor;
