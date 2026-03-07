"use client";

import { useState, useCallback, useEffect } from "react";
import useCapacitor from "./useCapacitor";

interface DeviceInfo {
  readonly isMobileDevice: boolean;
  readonly hasTouchScreen: boolean;
  readonly isApp: boolean;
  readonly isAppleMobile: boolean;
}

export default function useDeviceInfo(): DeviceInfo {
  const { isCapacitor } = useCapacitor();

  const getInfo = useCallback(
    (): DeviceInfo => {
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
        userAgentData?: { mobile?: boolean | undefined } | undefined;
        standalone?: boolean | undefined;
      };

      const hasTouchCapability =
        nav.maxTouchPoints > 0 ||
        "ontouchstart" in (typeof window !== "undefined" ? window : ({} as Window));

      const ua = nav.userAgent;
      const uaDataMobile = nav.userAgentData?.mobile;
      const classicMobile =
        /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const iPadDesktopUA = ua.includes("Macintosh") && hasTouchCapability;
      const appleMobile = /(iPhone|iPad|iPod)/i.test(ua) || iPadDesktopUA;
      const widthMobile =
        win.matchMedia?.("(max-width: 768px)")?.matches ?? false;

      const isMobileDevice =
        uaDataMobile ??
        (classicMobile || (isCapacitor && (iPadDesktopUA || widthMobile)));

      return {
        isMobileDevice,
        hasTouchScreen: hasTouchCapability,
        isApp: isCapacitor,
        isAppleMobile: appleMobile,
      };
    },
    [isCapacitor]
  );

  const [info, setInfo] = useState<DeviceInfo>(() => getInfo());

  useEffect(() => {
    const hasEventListenerApi =
      typeof globalThis.addEventListener === "function" &&
      typeof globalThis.removeEventListener === "function";

    const update = () =>
      setInfo((prev) => {
        const next = getInfo();
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

    update();
    if (hasEventListenerApi) {
      globalThis.addEventListener("resize", update);
    }

    return () => {
      if (hasEventListenerApi) {
        globalThis.removeEventListener("resize", update);
      }
    };
  }, [getInfo]);

  return info;
}
