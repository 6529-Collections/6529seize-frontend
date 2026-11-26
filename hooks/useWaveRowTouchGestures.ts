"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export const WAVE_PIN_SWIPE_THRESHOLD = 64;
const INTENT_DISTANCE = 8;

interface Options {
  readonly enabled: boolean;
  readonly scope: string;
  readonly rowRef: RefObject<HTMLDivElement | null>;
  readonly onTogglePin: () => void;
  readonly onSwipe: (distance: number, releasing: boolean) => void;
}

interface Gesture {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  swiping: boolean;
}

function blockReleaseClick() {
  let expiry: ReturnType<typeof setTimeout> | undefined;
  const clear = () => {
    globalThis.clearTimeout(expiry);
    document.removeEventListener("click", block, true);
    document.removeEventListener("pointerdown", clear, true);
  };
  const block = (event: MouseEvent) => {
    if (event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
    clear();
  };
  document.addEventListener("click", block, true);
  document.addEventListener("pointerdown", clear, true);
  return {
    clear,
    expire: () => {
      globalThis.clearTimeout(expiry);
      expiry = globalThis.setTimeout(clear, 400);
    },
  };
}

export function resistedWavePinDistance(distance: number) {
  if (distance <= WAVE_PIN_SWIPE_THRESHOLD) return distance;
  return (
    WAVE_PIN_SWIPE_THRESHOLD +
    40 * (1 - Math.exp(-(distance - WAVE_PIN_SWIPE_THRESHOLD) / 80))
  );
}

/** Horizontal intent owns a swipe; ordinary vertical movement stays native. */
export function useWaveRowTouchGestures(options: Options) {
  const { scope, rowRef } = options;
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let gesture: Gesture | null = null;
    let releaseClick: ReturnType<typeof blockReleaseClick> | undefined;

    function detach() {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", cancel);
      document.removeEventListener("pointerdown", additionalPointer, true);
      globalThis.removeEventListener("blur", cancel);
    }

    function finish() {
      releaseClick?.expire();
      gesture = null;
      detach();
    }

    function cancel() {
      if (gesture?.swiping) latest.current.onSwipe(0, true);
      finish();
    }

    function additionalPointer(event: PointerEvent) {
      if (gesture && event.pointerId !== gesture.id) cancel();
    }

    function start(event: PointerEvent) {
      if (
        !latest.current.enabled ||
        (event.pointerType !== "touch" && event.pointerType !== "pen") ||
        !event.isPrimary ||
        event.button !== 0 ||
        !(event.target instanceof Element) ||
        event.target.closest(
          "button, input, textarea, select, [role='button'], [role='slider']"
        )
      )
        return;
      cancel();
      releaseClick?.clear();
      releaseClick = undefined;
      // Leave the browser/OS edge-back gesture available.
      if (event.clientX < 20 || event.clientX > globalThis.innerWidth - 20)
        return;
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        swiping: false,
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", end);
      document.addEventListener("pointercancel", cancel);
      document.addEventListener("pointerdown", additionalPointer, true);
      globalThis.addEventListener("blur", cancel);
    }

    function move(event: PointerEvent) {
      if (!latest.current.enabled) {
        cancel();
        return;
      }
      const current = gesture;
      if (current?.id !== event.pointerId) return;
      const dx = event.clientX - current.x;
      const dy = Math.abs(event.clientY - current.y);
      if (!current.swiping) {
        if (Math.max(Math.abs(dx), dy) < INTENT_DISTANCE) return;
        releaseClick = blockReleaseClick();
        if (dx < INTENT_DISTANCE || dx < dy * 1.5) {
          finish();
          return;
        }
        current.swiping = true;
        if (row && typeof row.setPointerCapture === "function")
          row.setPointerCapture(event.pointerId);
      }
      const distance = Math.max(0, dx);
      latest.current.onSwipe(distance, false);
    }

    function end(event: PointerEvent) {
      if (!latest.current.enabled) {
        cancel();
        return;
      }
      const current = gesture;
      if (current?.id !== event.pointerId) return;
      if (current.swiping) {
        const distance = Math.max(0, event.clientX - current.x);
        latest.current.onSwipe(0, true);
        // Commit the release position, never the maximum distance reached.
        if (distance >= WAVE_PIN_SWIPE_THRESHOLD) latest.current.onTogglePin();
      }
      finish();
    }

    function contextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    row.addEventListener("pointerdown", start);
    row.addEventListener("contextmenu", contextMenu);
    return () => {
      cancel();
      row.removeEventListener("pointerdown", start);
      row.removeEventListener("contextmenu", contextMenu);
    };
  }, [scope, rowRef]);
}
