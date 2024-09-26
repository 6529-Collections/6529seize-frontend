import React, { createContext, useContext, useEffect, useMemo } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  PushNotifications,
  PushNotificationSchema,
} from "@capacitor/push-notifications";
import { Device, DeviceId, DeviceInfo } from "@capacitor/device";
import { NextRouter, useRouter } from "next/router";
import useCapacitor from "../../hooks/useCapacitor";
import { useAuth } from "../auth/Auth";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { useAccount } from "wagmi";
import { commonApiPost } from "../../services/api/common-api";

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
      initializeLocalNotifications().catch((error) =>
        console.error("Error initializing local notifications", error)
      );
    }
  };

  const initializePushNotifications = async (
    profile?: IProfileAndConsolidations
  ) => {
    PushNotifications.removeAllListeners();

    const deviceId = await Device.getId();
    const deviceInfo = await Device.getInfo();

    PushNotifications.addListener("registration", async (token) => {
      console.log("Push registration success");
      registerPushNotification(deviceId, deviceInfo, token.value, profile);
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error: ", error);
    });

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push notification received: ", notification);
      }
    );

    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        console.log("Push action performed: ", action);
        console.log("Connected profile", profile);

        handlePushNotificationAction(router, action.notification, profile);
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
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === "prompt") {
      permission = await LocalNotifications.requestPermissions();
    }
    return permission.display === "granted";
  };

  const sendLocalNotification = (id: number, title: string, body: string) => {
    if (isCapacitor) return;

    initializeLocalNotifications()
      .then(() =>
        LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
            },
          ],
        })
          .then((result) => {
            console.log("Local notification sent", result);
          })
          .catch((error) => {
            console.error("Error scheduling local notification", error);
          })
      )
      .catch((error) =>
        console.error("Error initializing local notifications", error)
      );
  };

  const value = useMemo(
    () => ({
      sendLocalNotification,
    }),
    []
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

const registerPushNotification = async (
  deviceId: DeviceId,
  deviceInfo: DeviceInfo,
  token: string,
  profile?: IProfileAndConsolidations
) => {
  console.log("Device id", deviceId);
  console.log("Connected profile", profile);
  console.log("Platform", deviceInfo.platform);

  try {
    const response = await commonApiPost({
      endpoint: `push-notifications/register`,
      body: {
        device_id: deviceId.identifier,
        token,
        platform: deviceInfo.platform,
        profile_id: profile?.profile?.external_id,
      },
    });
    console.log("Push registration success", response);
  } catch (error) {
    console.error("Push registration error", error);
  }
};

const handlePushNotificationAction = (
  router: NextRouter,
  notification: PushNotificationSchema,
  profile?: IProfileAndConsolidations
) => {
  const notificationData = notification.data;
  const notificationProfileId = notificationData.profile_id;

  if (
    profile &&
    notificationProfileId &&
    notificationProfileId !== profile.profile?.external_id
  ) {
    console.log("Notification profile id does not match connected profile");
    return;
  }

  const redirect = notificationData.redirect;

  if (redirect) {
    const type = redirect.type;
    const path = redirect.path;

    const redirectUrl = resolveRedirectUrl(type, path);

    if (redirectUrl) {
      router.push(redirectUrl);
    }
  }
};

const resolveRedirectUrl = (type: string, path: string) => {
  switch (type) {
    case "path":
    case "profile":
      return path;
    case "the-memes":
      return `/the-memes/${path}`;
    case "6529-gradient":
      return `/6529-gradient/${path}`;
    case "meme-lab":
      return `/meme-lab/${path}`;
    case "waves":
      return `/waves/${path}`;
    default:
      return null;
  }
};
