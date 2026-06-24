"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

const useCapacitor = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const isIos = platform === "ios";
  const isAndroid = platform === "android";
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isCapacitor) {
      return;
    }

    const syncAppState = async () => {
      try {
        const state = await App.getState();
        setIsActive(state.isActive);
      } catch (error) {
        console.error("Capacitor app state error:", error);
      }
    };

    void syncAppState();

    const appStateListener = App.addListener("appStateChange", (state) => {
      setIsActive(state.isActive);
    });

    return () => {
      const cleanupAppStateListener = async () => {
        try {
          const listener = await appStateListener;
          await listener.remove();
        } catch (error) {
          console.error("Capacitor app state listener cleanup error:", error);
        }
      };

      void cleanupAppStateListener();
    };
  }, [isCapacitor]);

  const [orientation, setOrientation] = useState<CapacitorOrientationType>(
    CapacitorOrientationType.PORTRAIT
  );

  useEffect(() => {
    if (!isCapacitor) return;

    const isPortrait = () =>
      window.matchMedia("(orientation: portrait)").matches;

    const handleOrientationChange = () => {
      setOrientation(
        isPortrait()
          ? CapacitorOrientationType.PORTRAIT
          : CapacitorOrientationType.LANDSCAPE
      );
    };

    handleOrientationChange();

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isCapacitor]);

  return {
    isCapacitor,
    platform,
    isIos,
    isAndroid,
    orientation,
    isActive,
  };
};

export default useCapacitor;
