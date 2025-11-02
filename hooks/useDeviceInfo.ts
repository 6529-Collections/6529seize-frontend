"use client";

import { useState, useCallback, useEffect } from "react";
import useCapacitor from "./useCapacitor";

interface DeviceInfo {
  readonly isMobileDevice: boolean;
  readonly hasTouchScreen: boolean;
  readonly isApp: boolean;
  readonly isAppleMobile: boolean;
}

/**
 * Hook that provides comprehensive device and screen information.
 * Combines functionality of useIsMobileDevice and useHasTouchScreen.
 *
 * @returns Object containing device information:
 * - isMobileDevice: Whether the device is a mobile device (based on user agent)
 * - hasTouchScreen: Whether the device has a touch screen
 * - isApp: Whether the device is an app
 */

export default function useDeviceInfo(): DeviceInfo {
  const { isCapacitor } = useCapacitor();

  const getInfo = useCallback((): DeviceInfo => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      const info: DeviceInfo = {
        isMobileDevice: false,
        hasTouchScreen: false,
        isApp: false,
        isAppleMobile: false,
      };
      return info;
    }

    const win = window as any;
    const nav = navigator as Navigator & {
      msMaxTouchPoints?: number;
      userAgentData?: { mobile?: boolean };
      standalone?: boolean;
    };

    const hasTouchScreen =
      (nav.maxTouchPoints ?? nav.msMaxTouchPoints ?? 0) > 0 ||
      "ontouchstart" in win ||
      win.matchMedia("(pointer: coarse)").matches;

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

    const info: DeviceInfo = {
      isMobileDevice,
      hasTouchScreen,
      isApp: isCapacitor,
      isAppleMobile: appleMobile,
    };
    return info;
  }, [isCapacitor]);

  const [info, setInfo] = useState<DeviceInfo>(() => getInfo());

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setInfo(getInfo());

    mq.addEventListener("change", update);
    window.addEventListener("resize", update);

    const onceTouch = () => {
      update();
      window.removeEventListener("touchstart", onceTouch);
    };
    window.addEventListener("touchstart", onceTouch, { passive: true });

    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("touchstart", onceTouch);
    };
  }, [getInfo]);

  return info;
}
