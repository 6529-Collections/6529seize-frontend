"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { TouchEvent } from "react";
import { animate } from "framer-motion";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { MOTION_SPRINGS } from "@/lib/motion/springs";
import {
  navigateAfterWaveSwipe,
  runWaveNavigationTransition,
  skipWaveNavigationTransition,
  type WaveScreen,
} from "@/helpers/waves/wave-navigation-transition";

const LEFT_EDGE_WIDTH = 32;

interface UseWaveListSwipeBackArgs {
  readonly enabled: boolean;
  readonly scope?: string;
  readonly onIntentStart?: (() => void) | undefined;
  readonly onSwipeBack: () => void;
  readonly targetScreen?: WaveScreen | undefined;
  readonly edgeSwipeBack?: boolean;
  readonly includeHeader?: boolean;
}

export function useWaveListSwipeBack<T extends HTMLElement = HTMLDivElement>({
  enabled,
  scope = "wave",
  onIntentStart,
  onSwipeBack,
  targetScreen,
  edgeSwipeBack = false,
  includeHeader = false,
}: UseWaveListSwipeBackArgs) {
  const ref = useRef<T>(null);
  const surface = useRef<HTMLElement | null>(null);
  const width = useRef(0);
  const position = useRef(0);
  const origin = useRef(0);
  const animation = useRef<Animation | ReturnType<typeof animate> | null>(null);
  const settling = useRef(false);
  const generation = useRef(0);
  const navigate = useRef(onSwipeBack);
  const useSpring = edgeSwipeBack && targetScreen === "list";
  const movesWholePage = targetScreen === "list" || includeHeader;
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
      priorityLeftEdgeWidth: edgeSwipeBack ? LEFT_EDGE_WIDTH : 0,
      onStart: () => {
        const previousAnimation = animation.current;
        animation.current = null;
        if (previousAnimation && "stop" in previousAnimation)
          previousAnimation.stop();
        else previousAnimation?.cancel();
        origin.current = useSpring ? position.current : 0;
        // Feed's snapshot handoff still uses its original content surface.
        surface.current = movesWholePage
          ? (ref.current?.closest<HTMLElement>("[data-wave-swipe-page]") ??
            ref.current)
          : ref.current;
        const measuredWidth =
          surface.current?.getBoundingClientRect().width ?? 0;
        width.current =
          measuredWidth > 0 ? measuredWidth : globalThis.innerWidth;
        surface.current?.style.setProperty("will-change", "transform");
        onIntentStart?.();
      },
      onMove: (distance) => {
        position.current = Math.min(origin.current + distance, width.current);
        surface.current?.style.setProperty(
          "transform",
          `translate3d(${position.current}px, 0, 0)`
        );
      },
      onEnd: (committed, distance, velocity) => {
        const element = surface.current;
        if (!element) return;
        const reducedMotion = globalThis.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        const cleanup = () => {
          element.style.removeProperty("transform");
          element.style.removeProperty("will-change");
          settling.current = false;
          position.current = 0;
          origin.current = 0;
        };
        // Disabling can cancel the active touch after layout cleanup has run.
        // Do not start another settle on a surface that is no longer navigable.
        if (
          !enabled ||
          reducedMotion ||
          (!useSpring && typeof element.animate !== "function")
        ) {
          cleanup();
          if (committed && enabled) navigateAfterWaveSwipe(navigate.current);
          return;
        }
        settling.current = committed;
        const releasedGeneration = generation.current;
        // Only Feed returns need a snapshot while its virtual rows settle.
        // Waves uses the existing live slide, without a capture at release.
        if (
          committed &&
          targetScreen === "feed" &&
          runWaveNavigationTransition(
            targetScreen,
            () => {
              if (generation.current !== releasedGeneration) {
                skipWaveNavigationTransition();
                return;
              }
              navigate.current();
            },
            {
              surface: element,
              distance: Math.min(distance, width.current),
              width: width.current,
              onFinish: () => {
                if (generation.current === releasedGeneration) cleanup();
              },
            }
          )
        ) {
          return;
        }
        const destination = committed ? width.current : 0;
        const start = Math.min(origin.current + distance, width.current);
        let navigated = false;
        const finishNavigation = () => {
          if (navigated || generation.current !== releasedGeneration) return;
          navigated = true;
          navigateAfterWaveSwipe(navigate.current);
        };
        const settle = useSpring
          ? animate(start, destination, {
              ...MOTION_SPRINGS.spatial.default,
              velocity,
              onUpdate: (value) => {
                position.current = Math.max(0, Math.min(value, width.current));
                element.style.transform = `translate3d(${position.current}px, 0, 0)`;
                // The remaining spring tail is invisible once the channel is
                // offscreen. Hand over to the list without waiting through it.
                if (committed && position.current >= destination - 1)
                  finishNavigation();
              },
            })
          : element.animate(
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
        // Keep the existing timed handoff for Feed and direct messages.
        if (!useSpring)
          element.style.transform = `translate3d(${destination}px, 0, 0)`;
        animation.current = settle;
        const finished =
          "finished" in settle ? settle.finished : Promise.resolve(settle);
        void finished.then(
          () => {
            if (animation.current !== settle) return;
            if (committed) {
              // Keep the outgoing screen out of view until the route changes.
              finishNavigation();
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
    const fallbackElement = ref.current;
    return () => {
      generation.current += 1;
      // The recognizer cancels its active touch first; clear any resulting settle.
      const previousAnimation = animation.current;
      animation.current = null;
      previousAnimation?.cancel();
      settling.current = false;
      position.current = 0;
      origin.current = 0;
      const element = surface.current ?? fallbackElement;
      surface.current = null;
      element?.style.removeProperty("transform");
      element?.style.removeProperty("will-change");
    };
  }, [enabled, movesWholePage, scope, targetScreen]);

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (
        edgeSwipeBack &&
        (event.touches[0]?.clientX ?? Infinity) <= LEFT_EDGE_WIDTH
      )
        return;
      if (!settling.current) startSwipe(event);
    },
    [edgeSwipeBack, startSwipe]
  );
  const onTouchStartCapture = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (
        edgeSwipeBack &&
        (event.touches[0]?.clientX ?? Infinity) <= LEFT_EDGE_WIDTH &&
        !settling.current
      )
        startSwipe(event);
    },
    [edgeSwipeBack, startSwipe]
  );
  return { ref, onTouchStart, onTouchStartCapture };
}
