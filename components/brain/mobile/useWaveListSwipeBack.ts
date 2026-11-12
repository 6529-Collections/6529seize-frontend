"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { TouchEvent } from "react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { navigateAfterWaveSwipe } from "@/helpers/waves/wave-navigation-transition";

interface UseWaveListSwipeBackArgs {
  readonly enabled: boolean;
  readonly scope?: string;
  readonly onIntentStart?: (() => void) | undefined;
  readonly onSwipeBack: () => void;
}

export function useWaveListSwipeBack<T extends HTMLElement = HTMLDivElement>({
  enabled,
  scope = "wave",
  onIntentStart,
  onSwipeBack,
}: UseWaveListSwipeBackArgs) {
  const ref = useRef<T>(null);
  const width = useRef(0);
  const animation = useRef<Animation | null>(null);
  const settling = useRef(false);
  const navigate = useRef(onSwipeBack);
  useLayoutEffect(() => {
    navigate.current = onSwipeBack;
  });
  const startSwipe = useHorizontalSwipe(
    {
      enabled,
      direction: 1,
      threshold: 100,
      // Recognize a rightward thumb arc before the browser starts a scroll.
      // Reply retains the recognizer's narrower default direction cone.
      intentRatio: 1.2,
      flick: true,
      onStart: () => {
        animation.current?.cancel();
        animation.current = null;
        const measuredWidth = ref.current?.getBoundingClientRect().width ?? 0;
        width.current =
          measuredWidth > 0 ? measuredWidth : globalThis.innerWidth;
        ref.current?.style.setProperty("will-change", "transform");
        onIntentStart?.();
      },
      onMove: (distance) => {
        ref.current?.style.setProperty(
          "transform",
          `translate3d(${Math.min(distance, width.current)}px, 0, 0)`
        );
      },
      onEnd: (committed, distance) => {
        const element = ref.current;
        if (!element) return;
        const reducedMotion = globalThis.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        const cleanup = () => {
          element.style.removeProperty("transform");
          element.style.removeProperty("will-change");
          settling.current = false;
        };
        if (reducedMotion || typeof element.animate !== "function") {
          cleanup();
          if (committed) navigateAfterWaveSwipe(navigate.current);
          return;
        }
        settling.current = committed;
        const destination = committed ? width.current : 0;
        element.style.transform = `translate3d(${destination}px, 0, 0)`;
        const settle = element.animate(
          [
            {
              transform: `translate3d(${Math.min(distance, width.current)}px, 0, 0)`,
            },
            { transform: `translate3d(${destination}px, 0, 0)` },
          ],
          {
            duration: committed ? 180 : 160,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          }
        );
        animation.current = settle;
        void settle.finished.then(
          () => {
            if (animation.current !== settle) return;
            if (committed) {
              // Keep the outgoing screen out of view until the route changes.
              navigateAfterWaveSwipe(navigate.current);
            } else {
              cleanup();
            }
          },
          () => {
            if (animation.current === settle) cleanup();
          }
        );
      },
    },
    scope
  );

  useLayoutEffect(() => {
    const element = ref.current;
    return () => {
      // The recognizer cancels its active touch first; clear any resulting settle.
      const previousAnimation = animation.current;
      animation.current = null;
      previousAnimation?.cancel();
      settling.current = false;
      element?.style.removeProperty("transform");
      element?.style.removeProperty("will-change");
    };
  }, [enabled, scope]);

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!settling.current) startSwipe(event);
    },
    [startSwipe]
  );
  return { ref, onTouchStart };
}
