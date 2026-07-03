"use client";

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
        : // eslint-disable-next-line promise/prefer-await-to-callbacks -- Browser frame scheduling is callback-based.
          (callback: FrameRequestCallback) =>
            window.setTimeout(() => {
              // eslint-disable-next-line promise/prefer-await-to-callbacks -- Browser frame scheduling is callback-based.
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
