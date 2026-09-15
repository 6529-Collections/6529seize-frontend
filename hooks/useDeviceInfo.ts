"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  hasTouchCapability,
  isTouchFirstEnvironment,
  subscribeToTouchFirstChanges,
} from "@/helpers/touch-first.helpers";
import useCapacitor from "./useCapacitor";

const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

interface DeviceInfo {
  readonly isMobileDevice: boolean;
  /**
   * Touch-first device (see helpers/touch-first.helpers.ts): phones and
   * tablets, including phones with a paired mouse or hovering stylus.
   * Hybrid touch-screen laptops (e.g. Windows Surface) are NOT touch-first —
   * they get the desktop experience. Use this for choosing touch vs desktop
   * affordances.
   */
  readonly hasTouchScreen: boolean;
  readonly isApp: boolean;
  readonly isAppleMobile: boolean;
}

export default function useDeviceInfo(): DeviceInfo {
  const { isCapacitor } = useCapacitor();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
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
        userAgentData?: { mobile?: boolean | undefined } | undefined;
        standalone?: boolean | undefined;
      };

      // Raw capability — true when touch input exists at all. Only used for
      // UA disambiguation (iPads pretending to be Macs) — never for UI mode.
      const hasTouchInput = touchDetected || hasTouchCapability();
      const hasTouchScreen = isTouchFirstEnvironment({ touchDetected });

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

  // Match SSR only during actual hydration; later client-only mounts must not
  // briefly choose a desktop layout before restoring their device capabilities.
  const [info, setInfo] = useState<DeviceInfo>(() =>
    isHydrated
      ? getInfo(false)
      : {
          isMobileDevice: false,
          hasTouchScreen: false,
          isApp: false,
          isAppleMobile: false,
        }
  );

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

  // Native identity is already hydration-safe and must not lag behind its
  // source while the capability effect catches up.
  return info.isApp === isCapacitor ? info : { ...info, isApp: isCapacitor };
}
