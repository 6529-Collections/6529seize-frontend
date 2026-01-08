"use client";

import { useCallback, useEffect, useRef } from "react";

interface DoubleTapOptions {
  /** Maximum time between taps in milliseconds. Default: 300 */
  readonly maxDelay?: number;
  /** Maximum distance between taps in pixels. Default: 30 */
  readonly maxDistance?: number;
  /** Callback when double-tap is detected */
  readonly onDoubleTap: (event: React.TouchEvent | React.MouseEvent) => void;
  /** Optional callback for single tap (called after delay if no second tap) */
  readonly onSingleTap?:
    | ((event: React.TouchEvent | React.MouseEvent) => void)
    | undefined;
  /** Whether double-tap detection is enabled. Default: true */
  readonly enabled?: boolean;
}

interface DoubleTapHandlers {
  readonly onTouchStart: (e: React.TouchEvent) => void;
  readonly onTouchEnd: (e: React.TouchEvent) => void;
  readonly onClick: (e: React.MouseEvent) => void;
}

interface TapInfo {
  timestamp: number;
  x: number;
  y: number;
}

/**
 * Hook for detecting double-tap gestures on touch and click events.
 * Returns event handlers to attach to the target element.
 */
export const useDoubleTap = ({
  maxDelay = 300,
  maxDistance = 30,
  onDoubleTap,
  onSingleTap,
  enabled = true,
}: DoubleTapOptions): DoubleTapHandlers => {
  const lastTapRef = useRef<TapInfo | null>(null);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pendingEventRef = useRef<React.TouchEvent | React.MouseEvent | null>(
    null
  );

  const clearSingleTapTimeout = useCallback(() => {
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSingleTapTimeout();
      pendingEventRef.current = null;
      lastTapRef.current = null;
    };
  }, [clearSingleTapTimeout]);

  const getDistance = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const handleTap = useCallback(
    (x: number, y: number, event: React.TouchEvent | React.MouseEvent) => {
      if (!enabled) return;

      const now = Date.now();
      const lastTap = lastTapRef.current;

      if (
        lastTap &&
        now - lastTap.timestamp <= maxDelay &&
        getDistance(x, y, lastTap.x, lastTap.y) <= maxDistance
      ) {
        // Double tap detected
        clearSingleTapTimeout();
        lastTapRef.current = null;
        pendingEventRef.current = null;
        onDoubleTap(event);
      } else {
        // First tap or taps too far apart/too slow
        lastTapRef.current = { timestamp: now, x, y };
        pendingEventRef.current = event;

        // Set up single tap callback if provided
        if (onSingleTap) {
          clearSingleTapTimeout();
          singleTapTimeoutRef.current = setTimeout(() => {
            if (pendingEventRef.current) {
              onSingleTap(pendingEventRef.current);
              pendingEventRef.current = null;
            }
            lastTapRef.current = null;
          }, maxDelay + 50); // Small buffer after maxDelay
        }
      }
    },
    [
      enabled,
      maxDelay,
      maxDistance,
      onDoubleTap,
      onSingleTap,
      clearSingleTapTimeout,
    ]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (touch) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touchStart = touchStartRef.current;
      const touch = e.changedTouches[0];

      if (touchStart && touch) {
        // Check if the touch moved too much (would be a swipe/scroll)
        const moveDistance = getDistance(
          touchStart.x,
          touchStart.y,
          touch.clientX,
          touch.clientY
        );

        if (moveDistance <= maxDistance) {
          handleTap(touch.clientX, touch.clientY, e);
        }
      }

      touchStartRef.current = null;
    },
    [enabled, maxDistance, handleTap]
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      if (
        "pointerType" in e.nativeEvent &&
        e.nativeEvent.pointerType === "mouse"
      ) {
        handleTap(e.clientX, e.clientY, e);
      }
    },
    [enabled, handleTap]
  );

  return {
    onTouchStart,
    onTouchEnd,
    onClick,
  };
};

export default useDoubleTap;
