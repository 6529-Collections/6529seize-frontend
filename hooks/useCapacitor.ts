import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

export enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

const useCapacitor = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  // const platform = Capacitor.getPlatform();
  const platform = "ios";

  const [orientation, setOrientation] = useState<CapacitorOrientationType>(
    CapacitorOrientationType.PORTRAIT
  );
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!isCapacitor) return;

    function isPortrait() {
      return window.matchMedia("(orientation: portrait)").matches;
    }

    function handleOrientationChange() {
      if (isPortrait()) {
        setOrientation(CapacitorOrientationType.PORTRAIT);
      } else {
        setOrientation(CapacitorOrientationType.LANDSCAPE);
      }
    }

    handleOrientationChange();

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isCapacitor]);

  useEffect(() => {
    if (!isCapacitor) return;

    const addKeyboardListeners = async () => {
      await Keyboard.addListener("keyboardWillShow", () => {
        setKeyboardVisible(true);
      });
      await Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardVisible(false);
      });
    };

    const removeKeyboardListeners = async () => {
      await Keyboard.removeAllListeners();
    };

    const onError = (error: any) => {
      console.error("Keyboard plugin error:", error);
    };

    addKeyboardListeners().catch(onError);

    return () => {
      removeKeyboardListeners().catch(onError);
    };
  }, [isCapacitor]);

  return {
    isCapacitor,
    platform,
    orientation,
    keyboardVisible,
  };
};

export default useCapacitor;
