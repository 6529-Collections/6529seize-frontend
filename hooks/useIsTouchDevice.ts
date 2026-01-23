"use client";

import { useEffect, useState } from "react";

export default function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof globalThis === "undefined") {
      return;
    }

    const win = globalThis as typeof globalThis & {
      matchMedia?: (query: string) => MediaQueryList;
    };

    const hasFinePointer = win.matchMedia?.("(pointer: fine)")?.matches;
    if (hasFinePointer) {
      setIsTouchDevice(false);
      return;
    }

    const onTouchStart = () => {
      setIsTouchDevice(true);
      globalThis.removeEventListener("touchstart", onTouchStart);
    };

    globalThis.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      globalThis.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return isTouchDevice;
}
