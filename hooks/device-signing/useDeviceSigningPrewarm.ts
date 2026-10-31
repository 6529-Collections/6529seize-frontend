"use client";

import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { prewarmDeviceSigning } from "@/lib/device-signing/sign-write";
import { useCallback, useEffect } from "react";

/**
 * Warms this browser's device key and grant on mount and whenever the tab
 * becomes visible again, so a write signs quickly. Returns a handler for
 * composer focus. Repeated calls are throttled; it does nothing while signed
 * messages are off.
 */
export function useDeviceSigningPrewarm(): () => void {
  const prewarm = useCallback(() => {
    if (isSignedMessagesEnabled()) {
      void prewarmDeviceSigning();
    }
  }, []);

  useEffect(() => {
    if (!isSignedMessagesEnabled()) {
      return;
    }
    prewarm();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        prewarm();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [prewarm]);

  return prewarm;
}
