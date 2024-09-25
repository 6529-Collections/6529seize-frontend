import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/router";
import { Device, DeviceId } from "@capacitor/device";

export enum CapacitorOrientationType {
  PORTRAIT,
  LANDSCAPE,
}

const useCapacitor = () => {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<DeviceId>();

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

  useEffect(() => {
    Device.getId().then((id) => {
      console.log("Device id", id);
      setDeviceId(id);
    });
  }, []);

  function initializeNotifications() {
    if (isCapacitor) {
      initializePushNotifications();
    } else {
      initializeLocalNotifications();
    }
  }

  function sendLocalNotification(id: number, title: string, body: string) {
    if (isCapacitor) {
      return;
    }
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

  async function initializeLocalNotifications(): Promise<boolean> {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === "prompt") {
      permission = await LocalNotifications.requestPermissions();
    }
    return permission.display === "granted";
  }

  const initializePushNotifications = async () => {
    PushNotifications.addListener("registration", (token) => {
      console.log("Push registration success, token: " + token.value);
      console.log("Device id", deviceId);
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error: ", error);
    });

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        // nothing to do here for now
      }
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("Push action performed: ", action);
        // TODO: Handle the action, e.g., navigate to a specific page
        router.push("/the-memes");
      }
    );

    // Request permission to use push notifications
    let permStatus = await PushNotifications.requestPermissions();
    console.log("Push permission status", permStatus);

    if (permStatus.receive === "granted") {
      await PushNotifications.register();
    } else {
      console.warn("Push notifications permission not granted");
    }
  };

  return {
    isCapacitor,
    platform,
    orientation,
    initializeNotifications,
    sendLocalNotification,
  };
};

export default useCapacitor;
