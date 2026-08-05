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
import {
  SWIPE_TRIGGER_THRESHOLD,
  SWIPE_EXIT_DURATION_MS,
  clampSwipeOffset,
  commitSwipeAction,
  getCardTransform,
  getCardTransitionDuration,
  useQuickVoteTouchSurfaceHandlers,
  type SwipeDirection,
  type TouchGestureAxis,
  type TouchLikeEvent,
} from "./useMemesQuickVotePreviewSwipe.touch";

type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

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
