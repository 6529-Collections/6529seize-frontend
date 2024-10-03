import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

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

  useEffect(() => {
    function isPortrait() {
      return window.matchMedia("(orientation: portrait)").matches;
    }

    function handleOrientationchange() {
      if (!isCapacitor) {
        return;
      }

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

  return {
    isCapacitor,
    platform,
    orientation,
  };
};

export default useCapacitor;
