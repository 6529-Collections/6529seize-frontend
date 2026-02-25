"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import useCapacitor from "./useCapacitor";

interface DeviceInfo {
  readonly isMobileDevice: boolean;
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
      const hasTouchScreen = touchDetected || maxTouchPoints > 0;

      const ua = nav.userAgent;
      const uaDataMobile = nav.userAgentData?.mobile;
      const classicMobile =
        /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const iPadDesktopUA = ua.includes("Macintosh") && hasTouchScreen;
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

    return () => {
      if (hasEventListenerApi) {
        globalThis.removeEventListener("resize", update);
        globalThis.removeEventListener("touchstart", onceTouch);
      }
    };
  }, [getInfo]);

  return info;
}
