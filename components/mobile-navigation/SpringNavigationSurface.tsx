"use client";

import { animate, m, useIsPresent, useMotionValue } from "framer-motion";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { MOTION_SPRINGS } from "@/lib/motion/springs";

/** One position owns the details push, finger tracking and exit. */
export default function SpringNavigationSurface({
  children,
  onBack,
  scope,
  reducedMotion,
}: {
  readonly children: ReactNode;
  readonly onBack: () => boolean;
  readonly scope: string;
  readonly reducedMotion: boolean;
}) {
  const isPresent = useIsPresent();
  // The server and first hydration render have the same position. Measure only
  // once mounted; neither viewport width nor gesture speed needs React state.
  const x = useMotionValue(0);
  const previousScope = useRef<string | undefined>(undefined);
  const mounted = useRef(false);
  const drag = useRef<{ origin: number; velocity: number | undefined }>({
    origin: 0,
    velocity: undefined,
  });

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Stop every animation on unmount, including gesture snap-back. Changes
      // to the page or preference must not cancel a presence-managed exit.
      x.stop();
    };
  }, [x]);

  useLayoutEffect(() => {
    if (!isPresent) return;
    if (previousScope.current === undefined) {
      if (!reducedMotion) x.jump(window.innerWidth);
    } else if (previousScope.current !== scope) {
      // A sub-page Back keeps this surface mounted. Its own transition must not
      // inherit the outer surface's completed swipe offset.
      x.jump(0);
    }
    drag.current.velocity = undefined;
    previousScope.current = scope;
    if (reducedMotion) {
      x.jump(0);
    } else void animate(x, 0, MOTION_SPRINGS.spatial.slow);
  }, [x, reducedMotion, scope, isPresent]);

  const onTouchStart = useHorizontalSwipe(
    {
      enabled: isPresent,
      direction: 1,
      threshold: 100,
      intentRatio: 1.2,
      flick: true,
      captureOnPress: true,
      allowReverse: true,
      onStart: () => {
        x.stop();
        const origin = Math.min(window.innerWidth, Math.max(0, x.get()));
        drag.current = { origin, velocity: undefined };
        x.set(origin);
      },
      onMove: (distance) => {
        if (!reducedMotion) x.set(Math.max(0, drag.current.origin + distance));
      },
      onEnd: (committed, _distance, velocity) => {
        if (!mounted.current || !isPresent) return;
        drag.current.velocity = velocity;
        if (committed && onBack()) return;
        if (!reducedMotion)
          void animate(x, 0, { ...MOTION_SPRINGS.spatial.default, velocity });
        drag.current.velocity = undefined;
      },
    },
    `${scope}:${reducedMotion}`
  );

  return (
    <m.div
      data-wave-details-spring
      className="tw-h-full tw-min-h-0"
      style={{ x, touchAction: "pan-y pinch-zoom" }}
      initial={reducedMotion ? { opacity: 0 } : false}
      animate={{ opacity: 1, transition: MOTION_SPRINGS.effects }}
      variants={{
        closed: () =>
          reducedMotion
            ? { opacity: 0, transition: MOTION_SPRINGS.effects }
            : {
                x: window.innerWidth,
                transition: {
                  ...MOTION_SPRINGS.spatial.default,
                  velocity: drag.current.velocity ?? x.getVelocity(),
                },
              },
      }}
      exit="closed"
      transformTemplate={(values) => {
        // CSS keeps the edge bounded during animation and viewport changes,
        // without parsing a transform string or subscribing to window resize.
        const offset =
          typeof values.x === "number" ? `${values.x}px` : (values.x ?? "0px");
        return `translate3d(clamp(0px, ${offset}, 100vw), 0, 0)`;
      }}
      onTouchStart={onTouchStart}
    >
      {children}
    </m.div>
  );
}
