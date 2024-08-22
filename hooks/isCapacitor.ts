import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";

const useIsCapacitor = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any)?.Capacitor) {
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
        LocalNotifications.schedule({
          notifications: [
            {
              title: "Notification",
              body: "You have some activity",
              id: 1,
              schedule: { at: new Date(Date.now() + 30000) },
              actionTypeId: "",
              extra: null,
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
