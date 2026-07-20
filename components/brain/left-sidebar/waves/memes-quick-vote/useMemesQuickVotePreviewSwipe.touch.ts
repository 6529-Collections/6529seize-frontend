"use client";

import type React from "react";
import { useCallback } from "react";
import { flushSync } from "react-dom";

export const SWIPE_TRIGGER_THRESHOLD = 32;
const MAX_SWIPE_OFFSET = 132;
const SWIPE_EXIT_DURATION_MS = 220;
const SWIPE_EXIT_OFFSET = 420;
const SWIPE_EXIT_ROTATION_DEGREES = 3;
const TOUCH_GESTURE_AXIS_LOCK_THRESHOLD = 8;

export type SwipeDirection = "left" | "right";
export type TouchGestureAxis = "pending" | "horizontal" | "vertical";
export type TouchLikeEvent = {
  readonly changedTouches?:
    | ArrayLike<{
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }>
    | undefined;
  readonly targetTouches?:
    | ArrayLike<{
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }>
    | undefined;
  readonly touches?:
    | ArrayLike<{
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }>
    | undefined;
  readonly stopPropagation?: () => void;
};

interface TouchSurfaceHandlerArgs {
  readonly fallbackTouchAxisRef: React.RefObject<TouchGestureAxis>;
  readonly fallbackTouchCurrentXRef: React.RefObject<number | null>;
  readonly fallbackTouchCurrentYRef: React.RefObject<number | null>;
  readonly fallbackTouchStartXRef: React.RefObject<number | null>;
  readonly fallbackTouchStartYRef: React.RefObject<number | null>;
  readonly handleSwipeEnd: (swipeDistance: number) => void;
  readonly isBusy: boolean;
  readonly isFallbackTouchActiveRef: React.RefObject<boolean>;
  readonly resetFallbackTouch: () => void;
  readonly resetSwipe: () => void;
  readonly setSwipeOffset: React.Dispatch<React.SetStateAction<number>>;
  readonly swipeExitDirection: SwipeDirection | null;
}

interface TouchSurfaceCompletionHandlerArgs {
  readonly fallbackTouchAxisRef: React.RefObject<TouchGestureAxis>;
  readonly fallbackTouchCurrentXRef: React.RefObject<number | null>;
  readonly fallbackTouchStartXRef: React.RefObject<number | null>;
  readonly handleSwipeEnd: (swipeDistance: number) => void;
  readonly isBusy: boolean;
  readonly isFallbackTouchActiveRef: React.RefObject<boolean>;
  readonly resetFallbackTouch: () => void;
  readonly resetSwipe: () => void;
}

export function commitSwipeAction(
  direction: SwipeDirection,
  onSkip: () => void,
  onVoteWithSwipe: () => void
) {
  if (direction === "left") {
    onSkip();
    return;
  }

  onVoteWithSwipe();
}

const getTouchClientX = (
  touch:
    | {
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }
    | undefined
): number | null => {
  if (typeof touch?.pageX === "number") {
    return touch.pageX;
  }

  if (typeof touch?.clientX === "number") {
    return touch.clientX;
  }

  return null;
};

const getTouchClientY = (
  touch:
    | {
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }
    | undefined
): number | null => {
  if (typeof touch?.pageY === "number") {
    return touch.pageY;
  }

  if (typeof touch?.clientY === "number") {
    return touch.clientY;
  }

  return null;
};

const getTouchListClientX = (
  touches:
    | ArrayLike<{
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }>
    | undefined
): number | null => {
  if (!touches || touches.length === 0) {
    return null;
  }

  return getTouchClientX(touches[0]);
};

const getTouchListClientY = (
  touches:
    | ArrayLike<{
        readonly clientX?: number;
        readonly clientY?: number;
        readonly pageX?: number;
        readonly pageY?: number;
      }>
    | undefined
): number | null => {
  if (!touches || touches.length === 0) {
    return null;
  }

  return getTouchClientY(touches[0]);
};

const getTouchEventClientX = (event: TouchLikeEvent): number | null =>
  getTouchListClientX(event.touches) ??
  getTouchListClientX(event.targetTouches) ??
  getTouchListClientX(event.changedTouches);

const getTouchEventClientY = (event: TouchLikeEvent): number | null =>
  getTouchListClientY(event.touches) ??
  getTouchListClientY(event.targetTouches) ??
  getTouchListClientY(event.changedTouches);

export const clampSwipeOffset = (swipeOffset: number) =>
  Math.max(-MAX_SWIPE_OFFSET, Math.min(swipeOffset, MAX_SWIPE_OFFSET));

function startTouchSurfaceTracking({
  fallbackTouchAxisRef,
  fallbackTouchCurrentXRef,
  fallbackTouchCurrentYRef,
  fallbackTouchStartXRef,
  fallbackTouchStartYRef,
  isFallbackTouchActiveRef,
  setSwipeOffset,
  startX,
  startY,
}: {
  readonly fallbackTouchAxisRef: React.RefObject<TouchGestureAxis>;
  readonly fallbackTouchCurrentXRef: React.RefObject<number | null>;
  readonly fallbackTouchCurrentYRef: React.RefObject<number | null>;
  readonly fallbackTouchStartXRef: React.RefObject<number | null>;
  readonly fallbackTouchStartYRef: React.RefObject<number | null>;
  readonly isFallbackTouchActiveRef: React.RefObject<boolean>;
  readonly setSwipeOffset: React.Dispatch<React.SetStateAction<number>>;
  readonly startX: number;
  readonly startY: number;
}) {
  fallbackTouchAxisRef.current = "pending";
  fallbackTouchStartXRef.current = startX;
  fallbackTouchStartYRef.current = startY;
  fallbackTouchCurrentXRef.current = startX;
  fallbackTouchCurrentYRef.current = startY;
  isFallbackTouchActiveRef.current = true;
  flushSync(() => {
    setSwipeOffset(0);
  });
}

function resolveTouchSurfaceOffset({
  currentX,
  currentY,
  fallbackTouchAxisRef,
  fallbackTouchCurrentXRef,
  fallbackTouchCurrentYRef,
  startX,
  startY,
}: {
  readonly currentX: number;
  readonly currentY: number;
  readonly fallbackTouchAxisRef: React.RefObject<TouchGestureAxis>;
  readonly fallbackTouchCurrentXRef: React.RefObject<number | null>;
  readonly fallbackTouchCurrentYRef: React.RefObject<number | null>;
  readonly startX: number;
  readonly startY: number;
}): number | null {
  fallbackTouchCurrentXRef.current = currentX;
  fallbackTouchCurrentYRef.current = currentY;

  const deltaX = currentX - startX;
  const deltaY = currentY - startY;
  const absoluteDeltaX = Math.abs(deltaX);
  const absoluteDeltaY = Math.abs(deltaY);

  if (fallbackTouchAxisRef.current === "pending") {
    if (
      absoluteDeltaX < TOUCH_GESTURE_AXIS_LOCK_THRESHOLD &&
      absoluteDeltaY < TOUCH_GESTURE_AXIS_LOCK_THRESHOLD
    ) {
      return null;
    }

    fallbackTouchAxisRef.current =
      absoluteDeltaX > absoluteDeltaY ? "horizontal" : "vertical";
  }

  if (fallbackTouchAxisRef.current !== "horizontal") {
    return null;
  }

  return clampSwipeOffset(deltaX);
}

function getTouchSurfaceDistance({
  fallbackTouchAxisRef,
  startX,
  endX,
}: {
  readonly fallbackTouchAxisRef: React.RefObject<TouchGestureAxis>;
  readonly startX: number | null;
  readonly endX: number | null;
}): number | null {
  if (
    fallbackTouchAxisRef.current !== "horizontal" ||
    startX === null ||
    endX === null
  ) {
    return null;
  }

  return endX - startX;
}

export function getCardTransform(
  isMobile: boolean,
  swipeExitDirection: SwipeDirection | null,
  swipeOffset: number
) {
  if (!isMobile) {
    return undefined;
  }

  if (swipeExitDirection === "left") {
    return `translateX(${Math.min(swipeOffset, 0) - SWIPE_EXIT_OFFSET}px) rotate(-${SWIPE_EXIT_ROTATION_DEGREES}deg)`;
  }

  if (swipeExitDirection === "right") {
    return `translateX(${Math.max(swipeOffset, 0) + SWIPE_EXIT_OFFSET}px) rotate(${SWIPE_EXIT_ROTATION_DEGREES}deg)`;
  }

  return `translateX(${swipeOffset}px)`;
}

export function getCardTransitionDuration(
  swipeExitDirection: SwipeDirection | null,
  swipeOffset: number
) {
  if (swipeExitDirection === null && swipeOffset !== 0) {
    return "0ms";
  }

  return `${SWIPE_EXIT_DURATION_MS}ms`;
}

export function useQuickVoteTouchSurfaceHandlers({
  fallbackTouchAxisRef,
  fallbackTouchCurrentXRef,
  fallbackTouchCurrentYRef,
  fallbackTouchStartXRef,
  fallbackTouchStartYRef,
  handleSwipeEnd,
  isBusy,
  isFallbackTouchActiveRef,
  resetFallbackTouch,
  resetSwipe,
  setSwipeOffset,
  swipeExitDirection,
}: TouchSurfaceHandlerArgs) {
  const touchAxisRef = fallbackTouchAxisRef;
  const touchCurrentXRef = fallbackTouchCurrentXRef;
  const touchCurrentYRef = fallbackTouchCurrentYRef;
  const touchStartXRef = fallbackTouchStartXRef;
  const touchStartYRef = fallbackTouchStartYRef;
  const isTouchActiveRef = isFallbackTouchActiveRef;
  const { handleTouchSurfaceCancel, handleTouchSurfaceEnd } =
    useQuickVoteTouchSurfaceCompletionHandlers({
      fallbackTouchAxisRef: touchAxisRef,
      fallbackTouchCurrentXRef: touchCurrentXRef,
      fallbackTouchStartXRef: touchStartXRef,
      handleSwipeEnd,
      isBusy,
      isFallbackTouchActiveRef: isTouchActiveRef,
      resetFallbackTouch,
      resetSwipe,
    });

  const handleTouchSurfaceStart = useCallback(
    (event: TouchLikeEvent) => {
      if (isBusy || swipeExitDirection !== null) {
        resetFallbackTouch();
        return;
      }
      if (isTouchActiveRef.current) {
        return;
      }
      const startX = getTouchEventClientX(event);
      const startY = getTouchEventClientY(event);
      if (startX === null || startY === null) {
        return;
      }
      event.stopPropagation?.();
      startTouchSurfaceTracking({
        fallbackTouchAxisRef: touchAxisRef,
        fallbackTouchCurrentXRef: touchCurrentXRef,
        fallbackTouchCurrentYRef: touchCurrentYRef,
        fallbackTouchStartXRef: touchStartXRef,
        fallbackTouchStartYRef: touchStartYRef,
        isFallbackTouchActiveRef: isTouchActiveRef,
        setSwipeOffset,
        startX,
        startY,
      });
    },
    [
      isBusy,
      isTouchActiveRef,
      resetFallbackTouch,
      setSwipeOffset,
      swipeExitDirection,
      touchAxisRef,
      touchCurrentXRef,
      touchCurrentYRef,
      touchStartXRef,
      touchStartYRef,
    ]
  );

  const handleTouchSurfaceMove = useCallback(
    (event: TouchLikeEvent) => {
      if (!isTouchActiveRef.current || swipeExitDirection !== null) {
        return;
      }
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      const currentX = getTouchEventClientX(event);
      const currentY = getTouchEventClientY(event);
      if (
        startX === null ||
        startY === null ||
        currentX === null ||
        currentY === null
      ) {
        return;
      }
      const nextSwipeOffset = resolveTouchSurfaceOffset({
        currentX,
        currentY,
        fallbackTouchAxisRef: touchAxisRef,
        fallbackTouchCurrentXRef: touchCurrentXRef,
        fallbackTouchCurrentYRef: touchCurrentYRef,
        startX,
        startY,
      });
      if (nextSwipeOffset === null) {
        return;
      }
      event.stopPropagation?.();
      flushSync(() => {
        setSwipeOffset(nextSwipeOffset);
      });
    },
    [
      isTouchActiveRef,
      setSwipeOffset,
      swipeExitDirection,
      touchAxisRef,
      touchCurrentXRef,
      touchCurrentYRef,
      touchStartXRef,
      touchStartYRef,
    ]
  );

  return {
    handleTouchSurfaceCancel,
    handleTouchSurfaceEnd,
    handleTouchSurfaceMove,
    handleTouchSurfaceStart,
  };
}

function useQuickVoteTouchSurfaceCompletionHandlers({
  fallbackTouchAxisRef,
  fallbackTouchCurrentXRef,
  fallbackTouchStartXRef,
  handleSwipeEnd,
  isBusy,
  isFallbackTouchActiveRef,
  resetFallbackTouch,
  resetSwipe,
}: TouchSurfaceCompletionHandlerArgs) {
  const handleTouchSurfaceEnd = useCallback(
    (event: TouchLikeEvent) => {
      if (!isFallbackTouchActiveRef.current) {
        return;
      }

      event.stopPropagation?.();

      if (isBusy) {
        resetFallbackTouch();
        resetSwipe();
        return;
      }

      const swipeDistance = getTouchSurfaceDistance({
        fallbackTouchAxisRef,
        startX: fallbackTouchStartXRef.current,
        endX: getTouchEventClientX(event) ?? fallbackTouchCurrentXRef.current,
      });

      if (swipeDistance === null) {
        resetFallbackTouch();
        resetSwipe();
        return;
      }

      handleSwipeEnd(swipeDistance);
    },
    [
      fallbackTouchAxisRef,
      fallbackTouchCurrentXRef,
      fallbackTouchStartXRef,
      handleSwipeEnd,
      isBusy,
      isFallbackTouchActiveRef,
      resetFallbackTouch,
      resetSwipe,
    ]
  );

  const handleTouchSurfaceCancel = useCallback(
    (event: TouchLikeEvent) => {
      if (!isFallbackTouchActiveRef.current) {
        return;
      }

      event.stopPropagation?.();
      resetFallbackTouch();
      resetSwipe();
    },
    [isFallbackTouchActiveRef, resetFallbackTouch, resetSwipe]
  );

  return {
    handleTouchSurfaceCancel,
    handleTouchSurfaceEnd,
  };
}
