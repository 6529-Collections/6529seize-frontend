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

    const nav = globalThis.navigator as Navigator | undefined;
    const maxTouchPoints = nav?.maxTouchPoints ?? 0;

    // Prefer "any-*" media queries so hybrid devices (touchscreen + trackpad/mouse)
    // aren't misclassified as touch-only when the primary pointer is coarse.
    const hasAnyFinePointer = win.matchMedia?.("(any-pointer: fine)")?.matches ?? false;
    const hasPrimaryFinePointer = win.matchMedia?.("(pointer: fine)")?.matches ?? false;
    const hasFinePointer = hasAnyFinePointer || hasPrimaryFinePointer;

    const hasAnyHover = win.matchMedia?.("(any-hover: hover)")?.matches ?? false;
    const hasPrimaryHover = win.matchMedia?.("(hover: hover)")?.matches ?? false;
    const hasHover = hasAnyHover || hasPrimaryHover;

    if (hasFinePointer || hasHover) {
      setIsTouchDevice(false);
      return;
    }

    // If there's no fine pointer and the device advertises touch points, treat it
    // as touch (important for first-touch interactions like long-press menus).
    if (maxTouchPoints > 0) {
      setIsTouchDevice(true);
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
