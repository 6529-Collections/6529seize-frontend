"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, Touch, TouchEvent } from "react";

const MOVE_THRESHOLD_PX = 8;
const SCROLL_SETTLE_MS = 150;
const DELAYED_CLICK_WINDOW_MS = 750;

interface TouchGesture {
  readonly identifier: number | undefined;
  readonly startX: number;
  readonly startY: number;
  cancelled: boolean;
  endedAt: number | null;
}

const isFromCard = (
  event: TouchEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
): boolean => event.currentTarget.contains(event.target as Node);

const hasMoved = (touch: Touch, gesture: TouchGesture): boolean =>
  Math.hypot(touch.clientX - gesture.startX, touch.clientY - gesture.startY) >
  MOVE_THRESHOLD_PX;

/** Keep scrolling, momentum-stop taps, and multi-touch from activating a card. */
export default function useCardTouchNavigationGuard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<TouchGesture | null>(null);
  const lastAncestorScrollAtRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const card = cardRef.current;
      if (!card) return;

      const target = event.target;
      if (
        target !== document &&
        !(target instanceof Node && target.contains(card))
      ) {
        return;
      }

      lastAncestorScrollAtRef.current = Date.now();
      const gesture = gestureRef.current;
      if (gesture?.endedAt === null) {
        gesture.cancelled = true;
      }
    };

    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (!isFromCard(event)) return;

    const currentGesture = gestureRef.current;
    if (currentGesture?.endedAt === null) {
      currentGesture.cancelled = true;
      return;
    }

    const touch = event.touches[0];
    const lastScrollAt = lastAncestorScrollAtRef.current;
    gestureRef.current = {
      identifier: touch?.identifier,
      startX: touch?.clientX ?? 0,
      startY: touch?.clientY ?? 0,
      cancelled:
        event.touches.length !== 1 ||
        (lastScrollAt !== null && Date.now() - lastScrollAt < SCROLL_SETTLE_MS),
      endedAt: null,
    };
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (!isFromCard(event)) return;
    const gesture = gestureRef.current;
    if (gesture?.endedAt !== null) return;

    const touch = event.touches[0];
    if (
      event.touches.length !== 1 ||
      !touch ||
      touch.identifier !== gesture.identifier ||
      hasMoved(touch, gesture)
    ) {
      gesture.cancelled = true;
    }
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (!isFromCard(event)) return;
    const gesture = gestureRef.current;
    if (!gesture) return;

    const endedTouch = Array.from(event.changedTouches).find(
      (touch) => touch.identifier === gesture.identifier
    );
    if (endedTouch && hasMoved(endedTouch, gesture)) {
      gesture.cancelled = true;
    }
    if (event.touches.length > 0) {
      gesture.cancelled = true;
      return;
    }
    gesture.endedAt = Date.now();
  }, []);

  const handleTouchCancel = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (!isFromCard(event)) return;
    const gesture = gestureRef.current;
    if (!gesture) return;

    gesture.cancelled = true;
    gesture.endedAt = Date.now();
  }, []);

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>): boolean => {
      // Keyboard and assistive activation must not inherit a touch rejection.
      if (!isFromCard(event) || event.detail === 0) return false;

      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (
        !gesture?.cancelled ||
        (gesture.endedAt !== null &&
          Date.now() - gesture.endedAt > DELAYED_CLICK_WINDOW_MS)
      ) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();
      return true;
    },
    []
  );

  return {
    cardRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleClickCapture,
  };
}
