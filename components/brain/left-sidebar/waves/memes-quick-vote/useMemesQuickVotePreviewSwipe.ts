"use client";

import type React from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type SwiperClass from "swiper";

const SWIPE_TRIGGER_THRESHOLD = 32;
const MAX_SWIPE_OFFSET = 132;
const SWIPE_EXIT_DURATION_MS = 220;
const SWIPE_EXIT_OFFSET = 420;
const SWIPE_EXIT_ROTATION_DEGREES = 3;
const QUICK_VOTE_TRANSFORM_DATA_ATTRIBUTE = "quickVoteTransform";
const QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG =
  "__memesQuickVoteComputedStylePatched";
type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

type SwipeDirection = "left" | "right";
type TouchLikeEvent = {
  readonly changedTouches?:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined;
  readonly targetTouches?:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined;
  readonly touches?:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
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
  readonly swipeOffset: number;
  readonly handleCardTransitionEnd: (
    event: React.TransitionEvent<HTMLElement>
  ) => void;
  readonly handleSwiperMove: (swiper: SwiperClass) => void;
  readonly handleSwiperTouchEnd: (swiper: SwiperClass) => void;
}

interface SwipeState {
  readonly fallbackTouchCurrentXRef: React.RefObject<number | null>;
  readonly fallbackTouchStartXRef: React.RefObject<number | null>;
  readonly handleCardTransitionEnd: (
    event: React.TransitionEvent<HTMLElement>
  ) => void;
  readonly handleSwipeEnd: (swipeDistance: number) => void;
  readonly handleSwiperMove: (swiper: SwiperClass) => void;
  readonly handleSwiperTouchEnd: (swiper: SwiperClass) => void;
  readonly isFallbackTouchActiveRef: React.RefObject<boolean>;
  readonly resetFallbackTouch: () => void;
  readonly resetSwipe: () => void;
  readonly setSwipeOffset: React.Dispatch<React.SetStateAction<number>>;
  readonly swipeExitDirection: SwipeDirection | null;
  readonly swipeOffset: number;
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
  touch: { readonly clientX?: number; readonly pageX?: number } | undefined
): number | null => {
  if (typeof touch?.pageX === "number") {
    return touch.pageX;
  }

  if (typeof touch?.clientX === "number") {
    return touch.clientX;
  }

  return null;
};

const getTouchListClientX = (
  touches:
    | ArrayLike<{ readonly clientX?: number; readonly pageX?: number }>
    | undefined
): number | null => {
  if (!touches || touches.length === 0) {
    return null;
  }

  return getTouchClientX(touches[0]);
};

const getTouchEventClientX = (event: TouchLikeEvent): number | null =>
  getTouchListClientX(event.touches) ??
  getTouchListClientX(event.targetTouches) ??
  getTouchListClientX(event.changedTouches);

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

function patchComputedStyleForFallbackSwipe() {
  if (
    globalThis.window === undefined ||
    typeof globalThis.window.Touch === "function"
  ) {
    return;
  }

  const browserWindow = globalThis.window;
  const patchedWindow = browserWindow as typeof browserWindow & {
    [QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG]?: boolean;
  };

  if (patchedWindow[QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG]) {
    return;
  }

  const originalGetComputedStyle =
    browserWindow.getComputedStyle.bind(browserWindow);

  browserWindow.getComputedStyle = ((
    element: Element,
    pseudoElement?: string
  ) => {
    const computedStyle = originalGetComputedStyle(element, pseudoElement);

    if (!(element instanceof HTMLElement)) {
      return computedStyle;
    }

    const transform =
      element.dataset[QUICK_VOTE_TRANSFORM_DATA_ATTRIBUTE] ?? "";

    if (transform.length === 0) {
      return computedStyle;
    }

    const patchedComputedStyle = Object.create(
      computedStyle
    ) as CSSStyleDeclaration;

    Object.defineProperty(patchedComputedStyle, "transform", {
      configurable: true,
      value: transform,
    });
    patchedComputedStyle.getPropertyValue = (property: string) =>
      property === "transform"
        ? transform
        : computedStyle.getPropertyValue(property);

    return patchedComputedStyle;
  }) as typeof browserWindow.getComputedStyle;

  patchedWindow[QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG] = true;
}

function useSwipeCommitTimeoutCleanup(clearSwipeCommitTimeout: () => void) {
  useLayoutEffect(
    () => () => {
      clearSwipeCommitTimeout();
    },
    [clearSwipeCommitTimeout]
  );
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
  const fallbackTouchStartXRef = useRef<number | null>(null);
  const fallbackTouchCurrentXRef = useRef<number | null>(null);
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
    fallbackTouchStartXRef.current = null;
    fallbackTouchCurrentXRef.current = null;
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

  const handleSwiperMove = useCallback(
    (swiper: SwiperClass) => {
      if (isBusy || !isMobile || swipeExitDirection !== null) {
        return;
      }

      setSwipeOffset(
        Math.max(
          -MAX_SWIPE_OFFSET,
          Math.min(swiper.touches.diff, MAX_SWIPE_OFFSET)
        )
      );
    },
    [isBusy, isMobile, swipeExitDirection]
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
    fallbackTouchCurrentXRef,
    fallbackTouchStartXRef,
    handleCardTransitionEnd,
    handleSwipeEnd,
    handleSwiperMove,
    handleSwiperTouchEnd,
    isFallbackTouchActiveRef,
    resetFallbackTouch,
    resetSwipe,
    setSwipeOffset,
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
  const [canUseSwiperTouchSurface, setCanUseSwiperTouchSurface] =
    useState(false);

  useEffect(() => {
    if (!isMobile) {
      setCanUseSwiperTouchSurface(false);
      return;
    }

    setCanUseSwiperTouchSurface(
      globalThis.window !== undefined &&
        typeof globalThis.window.Touch === "function"
    );
  }, [isMobile]);

  const swipeState = useQuickVotePreviewSwipeState({
    isBusy,
    isMobile,
    onAdvanceStart,
    onSkip,
    onVoteWithSwipe,
    swipeVoteAmount,
    usesTransitionlessSwipeCommit: isMobile && !canUseSwiperTouchSurface,
  });

  useLayoutEffect(() => {
    patchComputedStyleForFallbackSwipe();
  }, []);

  useLayoutEffect(() => {
    if (canUseSwiperTouchSurface || !isMobile) {
      return;
    }

    const previewCardNode = previewCardRef.current;

    if (!previewCardNode) {
      return;
    }

    const fallbackTouchStartRef = swipeState.fallbackTouchStartXRef;
    const fallbackTouchCurrentRef = swipeState.fallbackTouchCurrentXRef;
    const isFallbackTouchActive = swipeState.isFallbackTouchActiveRef;

    const handleTouchStart = (event: TouchEvent) => {
      if (isBusy || swipeState.swipeExitDirection !== null) {
        swipeState.resetFallbackTouch();
        return;
      }

      if (isFallbackTouchActive.current) {
        return;
      }

      const startX = getTouchEventClientX(event);

      if (startX === null) {
        return;
      }

      event.stopPropagation();
      fallbackTouchStartRef.current = startX;
      fallbackTouchCurrentRef.current = startX;
      isFallbackTouchActive.current = true;
      flushSync(() => {
        swipeState.setSwipeOffset(0);
      });
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (
        !isFallbackTouchActive.current ||
        swipeState.swipeExitDirection !== null
      ) {
        return;
      }

      const startX = fallbackTouchStartRef.current;
      const currentX = getTouchEventClientX(event);

      if (startX === null || currentX === null) {
        return;
      }

      event.stopPropagation();
      fallbackTouchCurrentRef.current = currentX;
      flushSync(() => {
        swipeState.setSwipeOffset(
          Math.max(
            -MAX_SWIPE_OFFSET,
            Math.min(currentX - startX, MAX_SWIPE_OFFSET)
          )
        );
      });
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isFallbackTouchActive.current) {
        return;
      }

      event.stopPropagation();

      if (isBusy) {
        swipeState.resetFallbackTouch();
        swipeState.resetSwipe();
        return;
      }

      const startX = fallbackTouchStartRef.current;
      const endX =
        getTouchEventClientX(event) ?? fallbackTouchCurrentRef.current;

      if (startX === null || endX === null) {
        swipeState.resetFallbackTouch();
        swipeState.resetSwipe();
        return;
      }

      swipeState.handleSwipeEnd(endX - startX);
    };

    const handleTouchCancel = (event: TouchEvent) => {
      if (!isFallbackTouchActive.current) {
        return;
      }

      event.stopPropagation();
      swipeState.resetFallbackTouch();
      swipeState.resetSwipe();
    };

    previewCardNode.addEventListener("touchstart", handleTouchStart);
    previewCardNode.addEventListener("touchmove", handleTouchMove);
    previewCardNode.addEventListener("touchend", handleTouchEnd);
    previewCardNode.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      previewCardNode.removeEventListener("touchstart", handleTouchStart);
      previewCardNode.removeEventListener("touchmove", handleTouchMove);
      previewCardNode.removeEventListener("touchend", handleTouchEnd);
      previewCardNode.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [canUseSwiperTouchSurface, isBusy, isMobile, previewCardRef, swipeState]);

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
    swipeOffset: swipeState.swipeOffset,
    handleCardTransitionEnd: swipeState.handleCardTransitionEnd,
    handleSwiperMove: swipeState.handleSwiperMove,
    handleSwiperTouchEnd: swipeState.handleSwiperTouchEnd,
  };
}
