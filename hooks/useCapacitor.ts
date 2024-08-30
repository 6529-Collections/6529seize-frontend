import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const useCapacitor = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isCapacitor) {
      if (!isInitialized) {
        initializePushNotifications();
        setIsInitialized(true);
      }
    }
  }, [isCapacitor]);

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

  return { isCapacitor, platform, sendNotification };
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
