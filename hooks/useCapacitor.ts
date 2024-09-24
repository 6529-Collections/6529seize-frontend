import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
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
    if (isCapacitor) {
      initializePushNotifications();
    } else {
      initializeLocalNotifications();
    }
  }, [isCapacitor]);

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

  function sendLocalNotification(id: number, title: string, body: string) {
    initializeLocalNotifications().then((isGranted) => {
      if (isGranted) {
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
    });
  }

  return { isCapacitor, platform, orientation, sendLocalNotification };
};

export default useCapacitor;

export async function initializeLocalNotifications(): Promise<Boolean> {
  let permission = await LocalNotifications.checkPermissions();
  if (permission.display === "prompt") {
    permission = await LocalNotifications.requestPermissions();
  }
  return permission.display === "granted";
}

export const initializePushNotifications = async () => {
  // Add event listeners first to ensure they are set up before registration
  PushNotifications.addListener("registration", (token) => {
    console.log("i am here");
    console.log("Push registration success, token: " + token.value);
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error: ", error);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received: ", notification);
    // TODO: Handle the notification as needed in your app
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push action performed: ", action);
    // TODO: Handle the action, e.g., navigate to a specific page
  });

  // Request permission to use push notifications
  console.log("Requesting push notification permissions");
  let permStatus = await PushNotifications.requestPermissions();
  console.log("Push permission status", permStatus);

  if (permStatus.receive === "granted") {
    // Register with Apple / FCM
    console.log("Registering with push notifications");
    await PushNotifications.register();
    console.log("Push notifications registered");
  } else {
    // Handle permission denial
    console.warn("Push notifications permission not granted");
    return;
  }
};
