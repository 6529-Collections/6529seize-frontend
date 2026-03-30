"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type SwiperClass from "swiper";
import {
  usePatchComputedStyleForFallbackSwipe,
  useQuickVotePreviewCardTouchFallback,
  useSwipeCommitTimeoutCleanup,
} from "./useMemesQuickVotePreviewSwipe.helpers";

const SWIPE_TRIGGER_THRESHOLD = 32;
const MAX_SWIPE_OFFSET = 132;
const SWIPE_EXIT_DURATION_MS = 220;
const SWIPE_EXIT_OFFSET = 420;
const SWIPE_EXIT_ROTATION_DEGREES = 3;
const TOUCH_GESTURE_AXIS_LOCK_THRESHOLD = 8;
type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

type SwipeDirection = "left" | "right";
type TouchGestureAxis = "pending" | "horizontal" | "vertical";
type TouchLikeEvent = {
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

interface UseMemesQuickVotePreviewSwipeArgs {
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly onAdvanceStart: () => void;
  readonly onSkip: () => void;
  readonly onVoteWithSwipe: () => void;
  readonly swipeVoteAmount: number | null;
}

interface UseMemesQuickVotePreviewSwipeResult {
  readonly previewCardRef: React.RefObject<HTMLElement | null>;
  readonly canUseSwiperTouchSurface: boolean;
  readonly cardTransform: string | undefined;
  readonly cardTransitionDuration: string;
  readonly handleTouchSurfaceCancel: (event: TouchLikeEvent) => void;
  readonly handleTouchSurfaceEnd: (event: TouchLikeEvent) => void;
  readonly handleTouchSurfaceMove: (event: TouchLikeEvent) => void;
  readonly handleTouchSurfaceStart: (event: TouchLikeEvent) => void;
  readonly swipeOffset: number;
  readonly handleCardTransitionEnd: (
    event: React.TransitionEvent<HTMLElement>
  ) => void;
  readonly handleSwiperMove: (swiper: SwiperClass) => void;
  readonly handleSwiperTouchEnd: (swiper: SwiperClass) => void;
}

interface SwipeState {
  readonly handleCardTransitionEnd: (
    event: React.TransitionEvent<HTMLElement>
  ) => void;
  readonly handleTouchSurfaceCancel: (event: TouchLikeEvent) => void;
  readonly handleTouchSurfaceEnd: (event: TouchLikeEvent) => void;
  readonly handleTouchSurfaceMove: (event: TouchLikeEvent) => void;
  readonly handleTouchSurfaceStart: (event: TouchLikeEvent) => void;
  readonly handleSwiperMove: (swiper: SwiperClass) => void;
  readonly handleSwiperTouchEnd: (swiper: SwiperClass) => void;
  readonly swipeExitDirection: SwipeDirection | null;
  readonly swipeOffset: number;
}

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

function commitSwipeAction(
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

const clampSwipeOffset = (swipeOffset: number) =>
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

function getCardTransform(
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

function getCardTransitionDuration(
  swipeExitDirection: SwipeDirection | null,
  swipeOffset: number
) {
  if (swipeExitDirection === null && swipeOffset !== 0) {
    return "0ms";
  }

  return `${SWIPE_EXIT_DURATION_MS}ms`;
}

function useQuickVoteTouchSurfaceHandlers({
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

function useQuickVoteSwiperHandlers({
  handleSwipeEnd,
  isBusy,
  isMobile,
  resetSwipe,
  setSwipeOffset,
  swipeExitDirection,
}: {
  readonly handleSwipeEnd: (swipeDistance: number) => void;
  readonly isBusy: boolean;
  readonly isMobile: boolean;
  readonly resetSwipe: () => void;
  readonly setSwipeOffset: React.Dispatch<React.SetStateAction<number>>;
  readonly swipeExitDirection: SwipeDirection | null;
}) {
  const handleSwiperMove = useCallback(
    (swiper: SwiperClass) => {
      if (isBusy || !isMobile || swipeExitDirection !== null) {
        return;
      }

      setSwipeOffset(clampSwipeOffset(swiper.touches.diff));
    },
    [isBusy, isMobile, setSwipeOffset, swipeExitDirection]
  );

  const handleSwiperTouchEnd = useCallback(
    (swiper: SwiperClass) => {
      if (isBusy || !isMobile) {
        resetSwipe();
        return;
      }

      handleSwipeEnd(swiper.touches.diff);
    },
    [handleSwipeEnd, isBusy, isMobile, resetSwipe]
  );

  return {
    handleSwiperMove,
    handleSwiperTouchEnd,
  };
}

function useQuickVotePreviewSwipeState({
  isBusy,
  isMobile,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
  swipeVoteAmount,
  usesTransitionlessSwipeCommit,
}: UseMemesQuickVotePreviewSwipeArgs & {
  readonly usesTransitionlessSwipeCommit: boolean;
}): SwipeState {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeExitDirection, setSwipeExitDirection] =
    useState<SwipeDirection | null>(null);
  const fallbackTouchAxisRef = useRef<TouchGestureAxis>("pending");
  const fallbackTouchStartXRef = useRef<number | null>(null);
  const fallbackTouchStartYRef = useRef<number | null>(null);
  const fallbackTouchCurrentXRef = useRef<number | null>(null);
  const fallbackTouchCurrentYRef = useRef<number | null>(null);
  const isFallbackTouchActiveRef = useRef(false);
  const swipeCommitTimeoutRef = useRef<TimeoutHandle | null>(null);
  const clearSwipeCommitTimeout = useCallback(() => {
    if (swipeCommitTimeoutRef.current === null) {
      return;
    }

    globalThis.clearTimeout(swipeCommitTimeoutRef.current);
    swipeCommitTimeoutRef.current = null;
  }, []);

  const resetFallbackTouch = useCallback(() => {
    fallbackTouchAxisRef.current = "pending";
    fallbackTouchStartXRef.current = null;
    fallbackTouchStartYRef.current = null;
    fallbackTouchCurrentXRef.current = null;
    fallbackTouchCurrentYRef.current = null;
    isFallbackTouchActiveRef.current = false;
  }, []);

  const resetSwipe = useCallback(() => {
    if (swipeExitDirection !== null) {
      return;
    }

    flushSync(() => {
      setSwipeOffset(0);
    });
  }, [swipeExitDirection]);

  const beginSwipeCommit = useCallback(
    (direction: SwipeDirection) => {
      if (swipeExitDirection !== null) {
        return;
      }

      clearSwipeCommitTimeout();
      resetFallbackTouch();
      onAdvanceStart();
      flushSync(() => {
        setSwipeExitDirection(direction);
      });

      if (!usesTransitionlessSwipeCommit) {
        return;
      }

      swipeCommitTimeoutRef.current = globalThis.setTimeout(() => {
        swipeCommitTimeoutRef.current = null;
        commitSwipeAction(direction, onSkip, onVoteWithSwipe);
      }, SWIPE_EXIT_DURATION_MS);
    },
    [
      clearSwipeCommitTimeout,
      onAdvanceStart,
      onSkip,
      onVoteWithSwipe,
      resetFallbackTouch,
      swipeExitDirection,
      usesTransitionlessSwipeCommit,
    ]
  );

  const handleSwipeEnd = useCallback(
    (swipeDistance: number) => {
      resetFallbackTouch();

      if (swipeDistance <= -SWIPE_TRIGGER_THRESHOLD) {
        beginSwipeCommit("left");
        return;
      }

      if (
        swipeDistance >= SWIPE_TRIGGER_THRESHOLD &&
        swipeVoteAmount !== null
      ) {
        beginSwipeCommit("right");
        return;
      }

      resetSwipe();
    },
    [beginSwipeCommit, resetFallbackTouch, resetSwipe, swipeVoteAmount]
  );
  const {
    handleTouchSurfaceCancel,
    handleTouchSurfaceEnd,
    handleTouchSurfaceMove,
    handleTouchSurfaceStart,
  } = useQuickVoteTouchSurfaceHandlers({
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
  });
  const { handleSwiperMove, handleSwiperTouchEnd } = useQuickVoteSwiperHandlers(
    {
      handleSwipeEnd,
      isBusy,
      isMobile,
      resetSwipe,
      setSwipeOffset,
      swipeExitDirection,
    }
  );

  const handleCardTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLElement>) => {
      if (
        event.target !== event.currentTarget ||
        event.propertyName !== "transform" ||
        swipeExitDirection === null
      ) {
        return;
      }

      if (usesTransitionlessSwipeCommit) {
        return;
      }

      commitSwipeAction(swipeExitDirection, onSkip, onVoteWithSwipe);
    },
    [onSkip, onVoteWithSwipe, swipeExitDirection, usesTransitionlessSwipeCommit]
  );

  useSwipeCommitTimeoutCleanup(clearSwipeCommitTimeout);

  return {
    handleCardTransitionEnd,
    handleTouchSurfaceCancel,
    handleTouchSurfaceEnd,
    handleTouchSurfaceMove,
    handleTouchSurfaceStart,
    handleSwiperMove,
    handleSwiperTouchEnd,
    swipeExitDirection,
    swipeOffset,
  };
}

export default function useMemesQuickVotePreviewSwipe({
  isBusy,
  isMobile,
  onAdvanceStart,
  onSkip,
  onVoteWithSwipe,
  swipeVoteAmount,
}: UseMemesQuickVotePreviewSwipeArgs): UseMemesQuickVotePreviewSwipeResult {
  const previewCardRef = useRef<HTMLElement | null>(null);
  const canUseSwiperTouchSurface =
    isMobile &&
    globalThis.window !== undefined &&
    typeof globalThis.window.Touch === "function";

  const swipeState = useQuickVotePreviewSwipeState({
    isBusy,
    isMobile,
    onAdvanceStart,
    onSkip,
    onVoteWithSwipe,
    swipeVoteAmount,
    usesTransitionlessSwipeCommit: isMobile && !canUseSwiperTouchSurface,
  });

  usePatchComputedStyleForFallbackSwipe();
  useQuickVotePreviewCardTouchFallback({
    canUseSwiperTouchSurface,
    handleTouchSurfaceCancel: swipeState.handleTouchSurfaceCancel,
    handleTouchSurfaceEnd: swipeState.handleTouchSurfaceEnd,
    handleTouchSurfaceMove: swipeState.handleTouchSurfaceMove,
    handleTouchSurfaceStart: swipeState.handleTouchSurfaceStart,
    isMobile,
    previewCardRef,
  });

  return {
    previewCardRef,
    canUseSwiperTouchSurface,
    cardTransform: getCardTransform(
      isMobile,
      swipeState.swipeExitDirection,
      swipeState.swipeOffset
    ),
    cardTransitionDuration: getCardTransitionDuration(
      swipeState.swipeExitDirection,
      swipeState.swipeOffset
    ),
    handleTouchSurfaceCancel: swipeState.handleTouchSurfaceCancel,
    handleTouchSurfaceEnd: swipeState.handleTouchSurfaceEnd,
    handleTouchSurfaceMove: swipeState.handleTouchSurfaceMove,
    handleTouchSurfaceStart: swipeState.handleTouchSurfaceStart,
    swipeOffset: swipeState.swipeOffset,
    handleCardTransitionEnd: swipeState.handleCardTransitionEnd,
    handleSwiperMove: swipeState.handleSwiperMove,
    handleSwiperTouchEnd: swipeState.handleSwiperTouchEnd,
  };
}
