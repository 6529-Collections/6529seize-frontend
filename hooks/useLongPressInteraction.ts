"use client";

import { useState, useRef, useCallback } from "react";

interface UseLongPressInteractionOptions {
  longPressDuration?: number;
  moveThreshold?: number;
  onInteractionStart?: () => void;
  hasTouchScreen?: boolean;
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
    longPressDuration = 500,
    moveThreshold = 10,
    onInteractionStart,
    hasTouchScreen = false, // default to false, should be provided by component
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

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;

      longPressTimeout.current = setTimeout(() => {
        startInteraction();
      }, longPressDuration);
    },
    [hasTouchScreen, longPressDuration, startInteraction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!longPressTimeout.current) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      const deltaX = Math.abs(touchX - touchStartX.current);
      const deltaY = Math.abs(touchY - touchStartY.current);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }
      }
    },
    [moveThreshold]
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
