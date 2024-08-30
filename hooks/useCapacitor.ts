import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isCapacitor) {
      if (!isInitialized) {
        initializePushNotifications();
        setIsInitialized(true);
      }
    }
  }, [isCapacitor]);

  useEffect(() => {
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

  function sendNotification(id: number, title: string, body: string) {
    if (!isInitialized) {
      console.error("Notifications not initialized");
      return;
    }

    LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
        },
      ],
    }).catch((error) => {
      console.error("Error sending notification", error);
    });
  }

  return { isCapacitor, platform, orientation, sendNotification };
};

export default useCapacitor;

export function initializePushNotifications() {
  LocalNotifications.requestPermissions()
    .then((permission) => {
      if (permission.display === "granted") {
        console.log("Notifications permission granted");
      } else {
        console.error("Notifications permission denied");
      }
    })
    .catch((error) => {
      console.error("Error requesting notifications", error);
    });
}
