"use client";

import type { MouseEvent, TouchEvent } from "react";
import { useCallback, useRef, useState } from "react";

const DEFAULT_SWIPE_THRESHOLD = 25;

interface UseSwipeDismissArgs {
  readonly onDismiss: () => void;
  readonly threshold?: number | undefined;
}

interface SwipeDismissHandlers {
  readonly onTouchStart: (e: TouchEvent) => void;
  readonly onTouchMove: (e: TouchEvent) => void;
  readonly onTouchEnd: () => void;
  readonly onMouseDown: (e: MouseEvent) => void;
  readonly onMouseMove: (e: MouseEvent) => void;
  readonly onMouseUp: () => void;
  readonly onMouseLeave: () => void;
}

interface UseSwipeDismissResult {
  readonly swipeOffset: number;
  readonly swipeOpacity: number;
  readonly consumeSuppressClick: () => boolean;
  readonly handlers: SwipeDismissHandlers;
}

export function useSwipeDismiss({
  onDismiss,
  threshold = DEFAULT_SWIPE_THRESHOLD,
}: UseSwipeDismissArgs): UseSwipeDismissResult {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeOffsetRef = useRef(0);
  const touchStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);

  const consumeSuppressClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return true;
    }
    return false;
  }, []);

  const resetSwipe = useCallback(() => {
    swipeOffsetRef.current = 0;
    setSwipeOffset(0);
    touchStartXRef.current = null;
  }, []);

  const maybeDismiss = useCallback(() => {
    if (swipeOffsetRef.current >= threshold) {
      suppressClickRef.current = true;
      onDismiss();
    }
  }, [onDismiss, threshold]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!e.touches[0]) return;
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartXRef.current === null || !e.touches[0]) return;
    const deltaX = Math.max(0, e.touches[0].clientX - touchStartXRef.current);
    swipeOffsetRef.current = deltaX;
    setSwipeOffset(deltaX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    maybeDismiss();
    resetSwipe();
  }, [maybeDismiss, resetSwipe]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDraggingRef.current = true;
    touchStartXRef.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) return;
    const deltaX = Math.max(0, e.clientX - touchStartXRef.current);
    swipeOffsetRef.current = deltaX;
    setSwipeOffset(deltaX);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    maybeDismiss();
    resetSwipe();
    isDraggingRef.current = false;
  }, [maybeDismiss, resetSwipe]);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      maybeDismiss();
      resetSwipe();
      isDraggingRef.current = false;
    }
  }, [maybeDismiss, resetSwipe]);

  return {
    swipeOffset,
    swipeOpacity: Math.max(0, 1 - swipeOffset / threshold),
    consumeSuppressClick,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
