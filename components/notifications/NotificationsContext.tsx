import React, { createContext, useContext, useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { Device } from "@capacitor/device";
import { useRouter } from "next/router";
import useCapacitor from "../../hooks/useCapacitor";
import { AuthContext, useAuth } from "../auth/Auth";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { useAccount } from "wagmi";

type NotificationsContextType = {
  sendLocalNotification: (id: number, title: string, body: string) => void;
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
  const { isConnected } = useAccount();
  const { connectedProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (connectedProfile) {
      initializeNotifications(connectedProfile);
    }
  }, [connectedProfile]);

  useEffect(() => {
    if (!isConnected) {
      initializeNotifications();
    }
  }, [isConnected]);

  const initializeNotifications = (profile?: IProfileAndConsolidations) => {
    console.log("Initializing notifications", profile);
    if (isCapacitor) {
      console.log("Initializing push notifications");
      initializePushNotifications(profile);
    } else {
      console.log("Initializing local notifications");
      initializeLocalNotifications();
    }
  };

  const initializePushNotifications = async (
    profile?: IProfileAndConsolidations
  ) => {
    PushNotifications.removeAllListeners();

    const deviceId = await Device.getId();

    PushNotifications.addListener("registration", (token) => {
      console.log("Push registration success, token: " + token.value);
      console.log("Device id", deviceId);
      console.log("Connected profile", profile);
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
        console.log("Connected profile", profile);
        console.log("redirecting to /the-memes");

        const redirectUrl = action.notification.data.redirectUrl;
        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }
    );

    // Request permission to use push notifications
    const permStatus = await PushNotifications.requestPermissions();
    console.log("Push permission status", permStatus);

    if (permStatus.receive === "granted") {
      await PushNotifications.register();
    } else {
      console.warn("Push notifications permission not granted");
    }
  };

  const initializeLocalNotifications = async (): Promise<boolean> => {
    try {
      let permission = await LocalNotifications.checkPermissions();
      if (permission.display === "prompt") {
        permission = await LocalNotifications.requestPermissions();
      }
      return permission.display === "granted";
    } catch (error) {
      console.log("Error initializing local notifications", error);
      return false;
    }
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
      } else {
        console.log("Local notifications permission not granted");
      }
    });
  };

  return (
    <NotificationsContext.Provider
      value={{
        sendLocalNotification,
      }}>
      {children}
    </NotificationsContext.Provider>
  );
};
