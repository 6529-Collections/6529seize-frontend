import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const useIsCapacitor = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsCapacitor(true);
      if (!isInitialized) {
        initializePushNotifications();
        setIsInitialized(true);
      }
    }
  }, []);

  return isCapacitor;
};

export default useIsCapacitor;

export function initializePushNotifications() {
  LocalNotifications.requestPermissions()
    .then((permission) => {
      if (permission.display === "granted") {
        console.log("Notifications permission granted");
        LocalNotifications.schedule({
          notifications: [
            {
              title: "Notification",
              body: "You have some activity",
              id: 1,
              schedule: { at: new Date(Date.now() + 10000) }, // 10 seconds from now
            },
          ],
        });
      } else {
        console.error("Notifications permission denied");
      }
    })
    .catch((error) => {
      console.error("Error requesting notifications", error);
    });
}
