"use client";

import { useState, useEffect } from "react";

export default function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const globalScope = globalThis as typeof globalThis & {
      window?: Window | undefined;
      navigator?: Navigator | undefined;
    };
    const browserWindow = globalScope.window;
    const browserNavigator = globalScope.navigator;

    const isTouch =
      !!browserWindow &&
      ("ontouchstart" in browserWindow ||
        (browserNavigator?.maxTouchPoints ?? 0) > 0 ||
        browserWindow.matchMedia?.("(pointer: coarse)")?.matches);

    setIsTouchDevice(isTouch);
  }, []);

  return isTouchDevice;
}
