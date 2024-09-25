import { useContext, useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/router";
import { Device } from "@capacitor/device";
import { AuthContext } from "../components/auth/Auth";
import useCapacitor from "./useCapacitor";

const useNotifications = () => {
  const { isCapacitor } = useCapacitor();
  const { connectedProfile } = useContext(AuthContext);
  const router = useRouter();

  function initializeNotifications() {
    console.log("Initializing notifications");
    if (isCapacitor) {
      console.log("Initializing push notifications");
      initializePushNotifications();
    } else {
      console.log("Initializing local notifications");
      initializeLocalNotifications();
    }
  }

  useEffect(() => {
    initializeNotifications();
  }, []);

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
    const deviceId = await Device.getId();

    PushNotifications.addListener("registration", (token) => {
      console.log("Push registration success, token: " + token.value);
      console.log("Device id", deviceId);
      console.log("Connected profile", connectedProfile);
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
    initializeNotifications,
    sendLocalNotification,
  };
};

export default useNotifications;
