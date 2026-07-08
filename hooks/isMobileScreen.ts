"use client";

import { useSyncExternalStore } from "react";

const MOBILE_SCREEN_MAX_WIDTH = 750;

const getBrowserWindow = (): Window | undefined =>
  (globalThis as typeof globalThis & { window?: Window }).window;

const isMobileScreen = () => {
  const browserWindow = getBrowserWindow();
  return (
    browserWindow !== undefined &&
    browserWindow.innerWidth <= MOBILE_SCREEN_MAX_WIDTH
  );
};

const subscribe = (onStoreChange: () => void) => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return () => undefined;
  }

  browserWindow.addEventListener("resize", onStoreChange);
  return () => browserWindow.removeEventListener("resize", onStoreChange);
};

export default function useIsMobileScreen() {
  return useSyncExternalStore(subscribe, isMobileScreen, () => false);
}
