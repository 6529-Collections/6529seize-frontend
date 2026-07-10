"use client";

import type { HTMLAttributes, TouchEvent } from "react";
import { useCallback, useMemo, useRef } from "react";

const SWIPE_EDGE_WIDTH_PX = 32;
const SWIPE_COMMIT_DISTANCE_PX = 80;
const SWIPE_AXIS_LOCK_DISTANCE_PX = 12;
const SWIPE_HORIZONTAL_DOMINANCE_RATIO = 1.5;

const SWIPE_BACK_IGNORE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "video",
  "audio",
  "canvas",
  "[contenteditable='true']",
  "[role='slider']",
  "[data-wave-swipe-back-ignore='true']",
  ".swiper",
].join(",");

type SwipeBackHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel"
>;

interface UseWaveListSwipeBackArgs {
  readonly enabled: boolean;
  readonly onIntentStart?: (() => void) | undefined;
  readonly onSwipeBack: () => void;
}

interface SwipeGesture {
  readonly startX: number;
  readonly startY: number;
  currentX: number;
  currentY: number;
}

const isHorizontallyScrollable = (element: HTMLElement): boolean => {
  if (element.scrollWidth <= element.clientWidth) {
    return false;
  }

  const overflowX =
    element.style.overflowX || globalThis.getComputedStyle(element).overflowX;
  return overflowX === "auto" || overflowX === "scroll";
};

const shouldIgnoreSwipeTarget = ({
  boundary,
  target,
}: {
  readonly boundary: EventTarget;
  readonly target: EventTarget;
}): boolean => {
  if (!(boundary instanceof HTMLElement) || !(target instanceof Element)) {
    return true;
  }

  if (target.closest(SWIPE_BACK_IGNORE_SELECTOR)) {
    return true;
  }

  let element = target instanceof HTMLElement ? target : target.parentElement;
  while (element && element !== boundary) {
    if (isHorizontallyScrollable(element)) {
      return true;
    }
    element = element.parentElement;
  }

  return false;
};

export function useWaveListSwipeBack({
  enabled,
  onIntentStart,
  onSwipeBack,
}: UseWaveListSwipeBackArgs): SwipeBackHandlers {
  const gestureRef = useRef<SwipeGesture | null>(null);

  const resetGesture = useCallback(() => {
    gestureRef.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      resetGesture();

      if (!enabled || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      if (
        !touch ||
        touch.clientX > SWIPE_EDGE_WIDTH_PX ||
        shouldIgnoreSwipeTarget({
          boundary: event.currentTarget,
          target: event.target,
        })
      ) {
        return;
      }

      gestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
      };
      onIntentStart?.();
    },
    [enabled, onIntentStart, resetGesture]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      const touch = event.touches[0];
      if (!gesture || event.touches.length !== 1 || !touch) {
        resetGesture();
        return;
      }

      gesture.currentX = touch.clientX;
      gesture.currentY = touch.clientY;

      const deltaX = gesture.currentX - gesture.startX;
      const deltaY = gesture.currentY - gesture.startY;
      const absoluteDeltaX = Math.abs(deltaX);
      const absoluteDeltaY = Math.abs(deltaY);

      if (
        (deltaX < 0 && absoluteDeltaX >= SWIPE_AXIS_LOCK_DISTANCE_PX) ||
        (absoluteDeltaY >= SWIPE_AXIS_LOCK_DISTANCE_PX &&
          absoluteDeltaY > absoluteDeltaX)
      ) {
        resetGesture();
      }
    },
    [resetGesture]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      if (!gesture) {
        return;
      }

      const touch = event.changedTouches[0];
      const endX = touch?.clientX ?? gesture.currentX;
      const endY = touch?.clientY ?? gesture.currentY;
      const deltaX = endX - gesture.startX;
      const absoluteDeltaY = Math.abs(endY - gesture.startY);
      resetGesture();

      if (
        deltaX >= SWIPE_COMMIT_DISTANCE_PX &&
        deltaX >= absoluteDeltaY * SWIPE_HORIZONTAL_DOMINANCE_RATIO
      ) {
        onSwipeBack();
      }
    },
    [onSwipeBack, resetGesture]
  );

  return useMemo(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: resetGesture,
    }),
    [handleTouchEnd, handleTouchMove, handleTouchStart, resetGesture]
  );
}
