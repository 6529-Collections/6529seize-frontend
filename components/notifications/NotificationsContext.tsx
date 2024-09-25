import React, { createContext, useContext, useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { Device } from "@capacitor/device";
import { useRouter } from "next/router";
import useCapacitor from "../../hooks/useCapacitor";
import { AuthContext } from "../auth/Auth";

type NotificationsContextType = {
  initializeNotifications: () => void;
  sendLocalNotification: (id: number, title: string, body: string) => void;
  isPermissionGranted: boolean | null;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isCapacitor } = useCapacitor();
  const { connectedProfile } = useContext(AuthContext);
  const router = useRouter();
  const [isPermissionGranted, setIsPermissionGranted] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = () => {
    console.log("Initializing notifications");
    if (isCapacitor) {
      console.log("Initializing push notifications");
      initializePushNotifications();
    } else {
      console.log("Initializing local notifications");
      initializeLocalNotifications();
    }
  };

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
        // Handle the notification if needed
      }
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("Push action performed: ", action);
        router.push("/the-memes");
      }
    );

    // Request permission to use push notifications
    const permStatus = await PushNotifications.requestPermissions();
    console.log("Push permission status", permStatus);

    if (permStatus.receive === "granted") {
      await PushNotifications.register();
      setIsPermissionGranted(true);
    } else {
      console.warn("Push notifications permission not granted");
      setIsPermissionGranted(false);
    }
  };

  const initializeLocalNotifications = async (): Promise<boolean> => {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === "prompt") {
      permission = await LocalNotifications.requestPermissions();
    }
    const isGranted = permission.display === "granted";
    setIsPermissionGranted(isGranted);
    return isGranted;
  };

  const sendLocalNotification = (id: number, title: string, body: string) => {
    if (isCapacitor) return;

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
  };

  return (
    <NotificationsContext.Provider
      value={{
        initializeNotifications,
        sendLocalNotification,
        isPermissionGranted,
      }}>
      {children}
    </NotificationsContext.Provider>
  );
};
