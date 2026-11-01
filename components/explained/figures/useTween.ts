"use client";

import { useEffect, useRef, useState } from "react";
import { EX_MOTION } from "../tokens";

/**
 * A figure's number that moves to its new value instead of jumping
 * (EXPLAINED.md §8.3: models move in 160 ms with the kit's ease). Under
 * reduced motion it takes the new value at once. Only what is drawn tweens:
 * the words and numbers beside a figure always say the value itself.
 */
export function useTween(target: number, ms: number = EX_MOTION.modelMs) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const start = current.current;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || start === target) {
      current.current = target;
      setValue(target);
      return undefined;
    }
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - began) / ms);
      // Close to EX_MOTION.ease, cubic-bezier(0.22, 1, 0.36, 1): fast, then settling.
      const eased = 1 - (1 - progress) ** 4;
      const next = start + (target - start) * eased;
      current.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}
