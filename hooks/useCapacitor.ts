import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

export enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

const useCapacitor = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const [orientation, setOrientation] = useState<CapacitorOrientationType>(
    CapacitorOrientationType.PORTRAIT
  );
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!isCapacitor) {
      return;
    }

    function isPortrait() {
      return window.matchMedia("(orientation: portrait)").matches;
    }

    function handleOrientationchange() {
      if (isPortrait()) {
        setOrientation(CapacitorOrientationType.PORTRAIT);
      } else {
        setOrientation(CapacitorOrientationType.LANDSCAPE);
      }
    }

    handleOrientationchange();

    window.addEventListener("orientationchange", handleOrientationchange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationchange);
    };
  }, []);

  useEffect(() => {
    if (!isCapacitor) {
      return;
    }

    try {
      Keyboard.addListener("keyboardWillShow", () => {
        setKeyboardVisible(true);
      });

      Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardVisible(false);
      });

      return () => {
        Keyboard.removeAllListeners();
      };
    } catch (error) {
      console.error("Keyboard plugin is not available on this device:", error);
    }
  }, []);

  return {
    isCapacitor,
    platform,
    orientation,
    keyboardVisible,
  };
};

export default useCapacitor;
