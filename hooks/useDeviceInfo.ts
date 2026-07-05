"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  hasFinePointerCapability,
  hasHoverCapability,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";
import useCapacitor from "./useCapacitor";

interface DeviceInfo {
  readonly isMobileDevice: boolean;
  /**
   * Touch-first device: touch input exists AND there is no fine pointer
   * (mouse/trackpad) and no hover support. Hybrid touch-screen laptops
   * (e.g. Windows Surface) are NOT touch-first — they get the desktop
   * experience. Use this for choosing touch vs desktop affordances.
   */
  readonly hasTouchScreen: boolean;
  readonly isApp: boolean;
  readonly isAppleMobile: boolean;
}

export default function useDeviceInfo(): DeviceInfo {
  const { isCapacitor } = useCapacitor();
  const touchDetectedRef = useRef(false);

  const getInfo = useCallback(
    (touchDetected: boolean): DeviceInfo => {
      if (
        typeof globalThis === "undefined" ||
        typeof navigator === "undefined"
      ) {
        return {
          isMobileDevice: false,
          hasTouchScreen: false,
          isApp: false,
          isAppleMobile: false,
        };
      }

      const win = globalThis as typeof globalThis & {
        matchMedia: (query: string) => MediaQueryList;
      };
      const nav = navigator as Navigator & {
        msMaxTouchPoints?: number | undefined;
        userAgentData?: { mobile?: boolean | undefined } | undefined;
        standalone?: boolean | undefined;
      };

      const maxTouchPoints = nav.maxTouchPoints ?? nav.msMaxTouchPoints ?? 0;
      // Raw capability: any touch input at all. Only used for UA
      // disambiguation (iPads pretending to be Macs) — never for UI mode.
      const hasTouchInput = touchDetected || maxTouchPoints > 0;
      // Touch-first: touch without mouse/trackpad/hover. Windows touch
      // laptops have a fine pointer and hover, so they stay desktop.
      const hasTouchScreen =
        hasTouchInput && !hasFinePointerCapability() && !hasHoverCapability();

      const ua = nav.userAgent;
      const uaDataMobile = nav.userAgentData?.mobile;
      const classicMobile =
        /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const iPadDesktopUA = ua.includes("Macintosh") && hasTouchInput;
      const appleMobile = /(iPhone|iPad|iPod)/i.test(ua) || iPadDesktopUA;
      const widthMobile =
        win.matchMedia?.("(max-width: 768px)")?.matches ?? false;

      const isMobileDevice =
        uaDataMobile ??
        (classicMobile || (isCapacitor && (iPadDesktopUA || widthMobile)));

      return {
        isMobileDevice,
        hasTouchScreen,
        isApp: isCapacitor,
        isAppleMobile: appleMobile,
      };
    },
    [isCapacitor]
  );

  const [info, setInfo] = useState<DeviceInfo>(() => getInfo(false));

  useEffect(() => {
    const hasEventListenerApi =
      typeof globalThis.addEventListener === "function" &&
      typeof globalThis.removeEventListener === "function";

    const update = () =>
      setInfo((prev) => {
        const next = getInfo(touchDetectedRef.current);
        if (
          prev.isMobileDevice === next.isMobileDevice &&
          prev.hasTouchScreen === next.hasTouchScreen &&
          prev.isApp === next.isApp &&
          prev.isAppleMobile === next.isAppleMobile
        ) {
          return prev;
        }
        return next;
      });

    const onceTouch = () => {
      touchDetectedRef.current = true;
      update();
      if (hasEventListenerApi) {
        globalThis.removeEventListener("touchstart", onceTouch);
      }
    };

    if (hasEventListenerApi) {
      globalThis.addEventListener("resize", update);
      globalThis.addEventListener("touchstart", onceTouch, { passive: true });
    }

    // Pointer/hover capabilities change when a mouse is (un)plugged or a
    // convertible flips posture — keep the classification in sync.
    const unsubscribeCapabilityChanges = subscribeToTouchFirstChanges(update);

    update();

    return () => {
      if (hasEventListenerApi) {
        globalThis.removeEventListener("resize", update);
        globalThis.removeEventListener("touchstart", onceTouch);
      }
      unsubscribeCapabilityChanges();
    };
  }, [getInfo]);

  return info;
}
