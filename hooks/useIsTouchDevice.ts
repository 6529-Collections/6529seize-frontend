"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import {
  hasFinePointerCapability,
  hasHoverCapability,
  hasTouchCapability,
  isTouchFirstEnvironment,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";

/**
 * True only when the device is touch-first (phone/tablet). Hybrid devices
 * (touchscreen + trackpad/mouse, e.g. Windows Surface laptops) report a fine
 * pointer or hover support and are classified as NOT touch, even after the
 * user touches the screen.
 */
export default function useIsTouchDevice(): boolean {
  const touchDetectedRef = useRef(false);

  const subscribe = useCallback((onStoreChange: () => void) => {
    // Capability media queries flip when a mouse is (un)plugged or a
    // convertible changes posture.
    const unsubscribeCapabilities = subscribeToTouchFirstChanges(onStoreChange);

    let touchListenerAttached = false;

    const detachTouchListener = () => {
      if (!touchListenerAttached) {
        return;
      }
      touchListenerAttached = false;
      globalThis.removeEventListener("touchstart", onTouchStart);
    };

    function onTouchStart() {
      touchDetectedRef.current = true;
      detachTouchListener();
      onStoreChange();
    }

    // Some devices advertise no capabilities at all until the first touch —
    // wait for it (important for first-touch interactions like long-press).
    const shouldAwaitFirstTouch =
      !touchDetectedRef.current &&
      !hasTouchCapability() &&
      !hasFinePointerCapability() &&
      !hasHoverCapability();

    if (
      shouldAwaitFirstTouch &&
      typeof globalThis.addEventListener === "function"
    ) {
      touchListenerAttached = true;
      globalThis.addEventListener("touchstart", onTouchStart, {
        passive: true,
      });
    }

    return () => {
      unsubscribeCapabilities();
      detachTouchListener();
    };
  }, []);

  const getSnapshot = useCallback(
    () => isTouchFirstEnvironment({ touchDetected: touchDetectedRef.current }),
    []
  );

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
