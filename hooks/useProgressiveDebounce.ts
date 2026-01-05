"use client";

import { useEffect, useRef } from "react";

interface DebounceOptions {
  minDelay: number;
  maxDelay: number;
  increaseFactor: number;
  decreaseFactor: number;
}

export const useProgressiveDebounce = (
  callback: () => void,
  dependencies: any[],
  options: DebounceOptions
) => {
  const { minDelay, maxDelay, increaseFactor, decreaseFactor } = options;
  const delayRef = useRef(minDelay);

  useEffect(() => {
    const handler = setTimeout(() => {
      callback();
      delayRef.current = minDelay; // Reset delay after execution
    }, delayRef.current);

    // Adjust delay for next call
    delayRef.current = Math.min(maxDelay, delayRef.current * increaseFactor);

    return () => {
      clearTimeout(handler);
      // Optionally adjust delay on cleanup
      delayRef.current = Math.max(minDelay, delayRef.current / decreaseFactor);
    };
  }, dependencies);
};
