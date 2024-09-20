import { useEffect, useRef, useState } from "react";

interface ProgressiveDebounceOptions {
  minDelay: number;
  maxDelay: number;
  increaseFactor: number;
  decreaseFactor: number;
}

export function useProgressiveDebounce(
  callback: () => void,
  dependencies: any[],
  options: ProgressiveDebounceOptions
): number {
  const { minDelay, maxDelay, increaseFactor, decreaseFactor } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTime = useRef<number>(0);
  const [currentDelay, setCurrentDelay] = useState<number>(minDelay);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime.current;

    let newDelay: number;
    if (timeSinceLastCall < currentDelay) {
      // Rapid change: increase delay
      newDelay = Math.min(currentDelay * increaseFactor, maxDelay);
    } else {
      // Slower change: decrease delay
      newDelay = Math.max(currentDelay / decreaseFactor, minDelay);
    }

    setCurrentDelay(newDelay);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
      lastCallTime.current = Date.now();
    }, newDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  return currentDelay;
}