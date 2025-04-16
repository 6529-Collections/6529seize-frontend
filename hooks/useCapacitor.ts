import { useEffect, useState } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";

export enum CapacitorOrientationType {
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
      setIsActive(false);
      return;
    } else {
      App.getState().then((state) => {
        setIsActive(state.isActive);
      });
    }

    App.addListener("appStateChange", (state) => {
      setIsActive(state.isActive);
    });

    return () => {
      App.removeAllListeners();
    };
  }, [isCapacitor]);

  const [orientation, setOrientation] = useState<CapacitorOrientationType>(
    CapacitorOrientationType.PORTRAIT
  );
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  useEffect(() => {
    if (!isCapacitor) return;

    let keyboardShowListener: PluginListenerHandle | undefined;
    let keyboardHideListener: PluginListenerHandle | undefined;

    const addKeyboardListeners = async () => {
      try {
        keyboardShowListener = await Keyboard.addListener(
          "keyboardWillShow",
          () => {
            setKeyboardVisible(true);
          }
        );

        keyboardHideListener = await Keyboard.addListener(
          "keyboardWillHide",
          () => {
            setKeyboardVisible(false);
          }
        );
      } catch (error) {
        console.error("Keyboard plugin error:", error);
      }
    };

    addKeyboardListeners();

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, [isCapacitor]);

  return {
    isCapacitor,
    platform,
    isIos,
    isAndroid,
    orientation,
    keyboardVisible,
    isActive,
  };
};

export default useCapacitor;
