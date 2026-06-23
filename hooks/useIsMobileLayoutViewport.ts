"use client";

import { useSyncExternalStore } from "react";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";

/** Reads the browser window when this hook is running client-side. */
const getBrowserWindow = (): Window | undefined =>
  (globalThis as typeof globalThis & { window?: Window }).window;

/** Returns whether the current viewport is using the compact drop layout. */
const isMobileLayoutViewport = () => {
  const browserWindow = getBrowserWindow();
  return (
    browserWindow !== undefined &&
    browserWindow.innerWidth < SIDEBAR_MOBILE_BREAKPOINT
  );
};

/** Subscribes viewport layout consumers to resize changes. */
const subscribe = (onStoreChange: () => void) => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return () => undefined;
  }

  browserWindow.addEventListener("resize", onStoreChange);
  return () => browserWindow.removeEventListener("resize", onStoreChange);
};

/** Tracks whether the active browser viewport should use mobile drop actions. */
export default function useIsMobileLayoutViewport(): boolean {
  return useSyncExternalStore(subscribe, isMobileLayoutViewport, () => false);
}
