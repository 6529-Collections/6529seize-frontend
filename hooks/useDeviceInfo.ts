"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
      if (typeof globalThis === "undefined" || typeof navigator === "undefined") {
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

      const hasFinePointer = win.matchMedia?.("(pointer: fine)")?.matches;
      const hasTouchScreen = hasFinePointer ? false : touchDetected;

      const ua = nav.userAgent;
      const uaDataMobile = nav.userAgentData?.mobile;
      const classicMobile =
        /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const iPadDesktopUA = ua.includes("Macintosh") && hasTouchScreen;
      const appleMobile = /(iPhone|iPad|iPod)/i.test(ua) || iPadDesktopUA;
      const widthMobile = win.matchMedia("(max-width: 768px)").matches;

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

    globalThis.addEventListener("resize", update);

    const onceTouch = () => {
      touchDetectedRef.current = true;
      update();
      globalThis.removeEventListener("touchstart", onceTouch);
    };
    globalThis.addEventListener("touchstart", onceTouch, { passive: true });

    return () => {
      globalThis.removeEventListener("resize", update);
      globalThis.removeEventListener("touchstart", onceTouch);
    };
  }, [getInfo]);

  return info;
}
