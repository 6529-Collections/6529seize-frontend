"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  commitWaveNavigationTransition,
  skipWaveNavigationTransition,
} from "@/helpers/waves/wave-navigation-transition";

type WaveNavigationScreen = "list" | "wave" | null;

export function getWaveNavigationScreen(
  pathname: string,
  waveId: string | null
): WaveNavigationScreen {
  if (pathname !== "/waves" && !pathname.startsWith("/waves/")) return null;
  return waveId ? "wave" : "list";
}

/** Animate a committed list/detail change without remounting its content. */
export function useWaveNavigationTransition(screen: WaveNavigationScreen) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScreenRef = useRef(screen);

  useEffect(() => skipWaveNavigationTransition, []);

  useLayoutEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;
    if (commitWaveNavigationTransition(screen)) return;
    const container = containerRef.current;
    if (
      !container ||
      screen === null ||
      previousScreen === null ||
      screen === previousScreen ||
      typeof container.animate !== "function"
    ) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const animation = container.animate(
      [
        {
          opacity: 0.75,
          transform: `scale(${screen === "wave" ? 0.98 : 1.02})`,
        },
        { opacity: 1, transform: "none" },
      ],
      { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
    );
    const stopForReducedMotion = () => {
      if (reducedMotion.matches) animation.cancel();
    };
    reducedMotion.addEventListener("change", stopForReducedMotion);
    return () => {
      animation.cancel();
      reducedMotion.removeEventListener("change", stopForReducedMotion);
    };
  }, [screen]);

  return containerRef;
}
