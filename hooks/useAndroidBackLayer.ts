"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { registerAndroidBackLayer } from "@/services/capacitor/android-back-layers";

/**
 * Register every owned Android modal, menu, lightbox or drawer while open.
 * Keep pending/non-dismissable guards in onBack, as in its normal close action.
 * Unknown layers block navigation but are never force-dismissed.
 */
export function useAndroidBackLayer(
  enabled: boolean,
  element: RefObject<HTMLElement | null>,
  onBack: () => void
) {
  const callback = useRef(onBack);
  useLayoutEffect(() => {
    callback.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (
      !enabled ||
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "android"
    ) {
      return;
    }
    return registerAndroidBackLayer({
      element: () => element.current,
      onBack: () => callback.current(),
    });
  }, [enabled, element]);
}
