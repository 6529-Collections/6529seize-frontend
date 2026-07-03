"use client";

/* eslint promise/prefer-await-to-callbacks: "off" -- Browser paint scheduling APIs are callback-based. */

import { useEffect, useState } from "react";

export function useFirstVisibleDropsPainted(hasVisibleDrops: boolean): boolean {
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (!hasVisibleDrops || painted) {
      return;
    }

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
    const markPainted = () => {
      timeoutId = globalThis.setTimeout(() => {
        setPainted(true);
      }, 0);
    };

    let cancelFrame: () => void;
    if (typeof globalThis.requestAnimationFrame === "function") {
      const animationFrameId = globalThis.requestAnimationFrame(markPainted);
      cancelFrame = () => globalThis.cancelAnimationFrame(animationFrameId);
    } else {
      const fallbackTimeoutId = globalThis.setTimeout(() => {
        markPainted();
      }, 16);
      cancelFrame = () => globalThis.clearTimeout(fallbackTimeoutId);
    }

    return () => {
      cancelFrame();
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [hasVisibleDrops, painted]);

  return painted;
}
