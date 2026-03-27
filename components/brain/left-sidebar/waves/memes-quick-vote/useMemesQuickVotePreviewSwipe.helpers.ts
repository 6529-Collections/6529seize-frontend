"use client";

import type React from "react";
import { useLayoutEffect } from "react";

const QUICK_VOTE_TRANSFORM_DATA_ATTRIBUTE = "quickVoteTransform";
const QUICK_VOTE_COMPUTED_STYLE_PATCH_FLAG =
  "__memesQuickVoteComputedStylePatched";

function patchComputedStyleForFallbackSwipe() {
  if (typeof globalThis.window.Touch === "function") {
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

export function usePatchComputedStyleForFallbackSwipe() {
  useLayoutEffect(() => {
    patchComputedStyleForFallbackSwipe();
  }, []);
}

export function useSwipeCommitTimeoutCleanup(
  clearSwipeCommitTimeout: () => void
) {
  useLayoutEffect(
    () => () => {
      clearSwipeCommitTimeout();
    },
    [clearSwipeCommitTimeout]
  );
}

export function useQuickVotePreviewCardTouchFallback({
  canUseSwiperTouchSurface,
  handleTouchSurfaceCancel,
  handleTouchSurfaceEnd,
  handleTouchSurfaceMove,
  handleTouchSurfaceStart,
  isMobile,
  previewCardRef,
}: {
  readonly canUseSwiperTouchSurface: boolean;
  readonly handleTouchSurfaceCancel: (event: TouchEvent) => void;
  readonly handleTouchSurfaceEnd: (event: TouchEvent) => void;
  readonly handleTouchSurfaceMove: (event: TouchEvent) => void;
  readonly handleTouchSurfaceStart: (event: TouchEvent) => void;
  readonly isMobile: boolean;
  readonly previewCardRef: React.RefObject<HTMLElement | null>;
}) {
  useLayoutEffect(() => {
    if (canUseSwiperTouchSurface || !isMobile) {
      return;
    }

    const previewCardNode = previewCardRef.current;

    if (!previewCardNode) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      handleTouchSurfaceStart(event);
    };
    const handleTouchMove = (event: TouchEvent) => {
      handleTouchSurfaceMove(event);
    };
    const handleTouchEnd = (event: TouchEvent) => {
      handleTouchSurfaceEnd(event);
    };
    const handleTouchCancel = (event: TouchEvent) => {
      handleTouchSurfaceCancel(event);
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
  }, [
    canUseSwiperTouchSurface,
    handleTouchSurfaceCancel,
    handleTouchSurfaceEnd,
    handleTouchSurfaceMove,
    handleTouchSurfaceStart,
    isMobile,
    previewCardRef,
  ]);
}
