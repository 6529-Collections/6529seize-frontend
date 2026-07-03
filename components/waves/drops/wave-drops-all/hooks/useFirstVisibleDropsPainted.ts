"use client";

/* eslint promise/prefer-await-to-callbacks: "off" -- Browser paint scheduling APIs are callback-based. */

import { useEffect, useState } from "react";

export function useFirstVisibleDropsPainted(hasVisibleDrops: boolean): boolean {
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (!hasVisibleDrops || painted) {
      return;
    }

    const requestFrame =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) =>
            window.setTimeout(() => {
              callback(performance.now());
            }, 16);
    const cancelFrame =
      typeof window.cancelAnimationFrame === "function"
        ? window.cancelAnimationFrame.bind(window)
        : window.clearTimeout.bind(window);
    let timeoutId: number | null = null;
    const animationFrameId = requestFrame(() => {
      timeoutId = window.setTimeout(() => {
        setPainted(true);
      }, 0);
    });

    return () => {
      cancelFrame(animationFrameId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hasVisibleDrops, painted]);

  return painted;
}
