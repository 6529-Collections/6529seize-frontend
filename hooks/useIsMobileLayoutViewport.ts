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

const subscribers = new Set<() => void>();
let lastIsMobile = false;

const handleMobileLayoutResize = () => {
  const isMobile = isMobileLayoutViewport();
  if (isMobile === lastIsMobile) {
    return;
  }

  lastIsMobile = isMobile;
  for (const subscriber of subscribers) {
    subscriber();
  }
};

/** Shares one resize listener and notifies consumers only on a layout change. */
const subscribe = (onStoreChange: () => void) => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return () => undefined;
  }

  if (subscribers.size === 0) {
    lastIsMobile = isMobileLayoutViewport();
    browserWindow.addEventListener("resize", handleMobileLayoutResize);
  }

  subscribers.add(onStoreChange);
  return () => {
    subscribers.delete(onStoreChange);
    if (subscribers.size === 0) {
      browserWindow.removeEventListener("resize", handleMobileLayoutResize);
    }
  };
};

/** Tracks whether the active browser viewport should use mobile drop actions. */
export default function useIsMobileLayoutViewport(): boolean {
  return useSyncExternalStore(subscribe, isMobileLayoutViewport, () => false);
}
