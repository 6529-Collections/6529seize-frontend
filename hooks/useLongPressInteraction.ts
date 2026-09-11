"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Default hold time before a touch counts as a long press. Exported so E2E
 * specs that synthesize long presses (tests/input) derive their hold time
 * from the real value instead of hardcoding a copy that can drift.
 */
export const DEFAULT_LONG_PRESS_DURATION_MS = 500;

interface UseLongPressInteractionOptions {
  longPressDuration?: number | undefined;
  moveThreshold?: number | undefined;
  onInteractionStart?: (() => void) | undefined;
  hasTouchScreen?: boolean | undefined;
  /**
   * Whether to call preventDefault on touch events. Defaults to true to
   * suppress selection/scroll, but can be disabled when downstream logic
   * relies on the synthetic click event (e.g. tap-to-toggle buttons).
   */
  preventDefault?: boolean | undefined;
}

/**
 * Hook for handling long press touch interactions.
 * Detects when a user holds their finger on an element and manages the resulting state.
 * Can be used to trigger various actions like showing menus, selections, or other UI responses.
 *
 * @param options Configuration options for the long press behavior, including hasTouchScreen which must be provided externally
 * @returns Object with interaction state and touch event handlers
 */
export default function useLongPressInteraction(
  options: UseLongPressInteractionOptions = {}
) {
  const {
    longPressDuration = DEFAULT_LONG_PRESS_DURATION_MS,
    moveThreshold = 10,
    onInteractionStart,
    hasTouchScreen = false, // default to false, should be provided by component
    preventDefault = true,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const startInteraction = useCallback(() => {
    setIsActive(true);
    setLongPressTriggered(true);
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!hasTouchScreen) return;

      // Prevent text selection highlighting during long press
      if (preventDefault && e.cancelable) {
        e.preventDefault();
      }

      touchStartX.current = e.touches[0]?.clientX!;
      touchStartY.current = e.touches[0]?.clientY!;

      longPressTimeout.current = setTimeout(() => {
        startInteraction();
      }, longPressDuration);
    },
    [hasTouchScreen, longPressDuration, startInteraction, preventDefault]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!longPressTimeout.current) return;

      // Prevent scrolling/selection during long press detection
      if (preventDefault && e.cancelable) {
        e.preventDefault();
      }

      const touchX = e.touches[0]?.clientX;
      const touchY = e.touches[0]?.clientY;

      const deltaX = Math.abs(touchX! - touchStartX.current);
      const deltaY = Math.abs(touchY! - touchStartY.current);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    },
    [moveThreshold, preventDefault]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    setLongPressTriggered(false);
  }, []);

  return {
    isActive,
    setIsActive,
    longPressTriggered,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}
