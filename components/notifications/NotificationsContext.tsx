import React, { createContext, useContext, useEffect, useMemo } from "react";
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
import {
  commonApiPost,
  commonApiPostWithoutBodyAndResponse,
} from "../../services/api/common-api";

export const BRAIN_NOTIFICATION_ICON =
  "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP";

type NotificationsContextType = {
  sendLocalNotification: (title: string, body: string, icon?: string) => void;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const redirectConfig = {
  path: ({ path }: { path: string }) => `/${path}`,
  profile: ({ handle }: { handle: string }) => `/${handle}`,
  "the-memes": ({ id }: { id: string }) => `/the-memes/${id}`,
  "6529-gradient": ({ id }: { id: string }) => `/6529-gradient/${id}`,
  "meme-lab": ({ id }: { id: string }) => `/meme-lab/${id}`,
  waves: ({ wave_id, drop_id }: { wave_id: string; drop_id: string }) => {
    let base = `/waves/${wave_id}`;
    return drop_id ? `${base}?drop=${drop_id}` : base;
  },
};

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
    try {
      if (isCapacitor) {
        console.log("Initializing push notifications");
        initializePushNotifications(profile);
      } else {
        console.log("Initializing local notifications");
        initializeLocalNotifications().catch((error) =>
          console.error("Error initializing local notifications", error)
        );
      }
    } catch (error) {
      console.error("Error initializing notifications", error);
    }
  };

  const initializePushNotifications = async (
    profile?: IProfileAndConsolidations
  ) => {
    PushNotifications.removeAllListeners();

    const deviceId = await Device.getId();
    const deviceInfo = await Device.getInfo();

    PushNotifications.addListener("registration", async (token) => {
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
        handlePushNotificationAction(router, action.notification, profile);
      }
    );

    const permStatus = await PushNotifications.requestPermissions();
    console.log("Push permission status", permStatus);

    if (permStatus.receive === "granted") {
      await PushNotifications.register();
    } else {
      console.warn("Push notifications permission not granted");
    }
  };

  const initializeLocalNotifications = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("Local notifications not supported");
      return false;
    }

    let permission = await Notification.requestPermission();

    return permission === "granted";
  };

  const sendLocalNotification = (
    title: string,
    body: string,
    icon?: string
  ) => {
    if (isCapacitor) return;

    initializeLocalNotifications()
      .then(() => {
        const notification = new Notification(title, {
          body: body,
          icon: icon,
        });

        notification.onclick = function () {
          window.focus();
          router.push("/my-stream/notifications");
        };
        console.log("Local notification sent", notification);
      })
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

const handlePushNotificationAction = async (
  router: NextRouter,
  notification: PushNotificationSchema,
  profile?: IProfileAndConsolidations
) => {
  console.log("Push notification action performed", notification);
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

  const notificationId = notificationData.notification_id;
  await commonApiPostWithoutBodyAndResponse({
    endpoint: `notifications/${notificationId}/read`,
  })
    .then(() => {
      console.log("Notification marked as read", notificationId);
    })
    .catch((error) => {
      console.error(
        "Error marking notification as read",
        notificationId,
        error
      );
    })
    .finally(() => {
      const redirectUrl = resolveRedirectUrl(notificationData);
      if (redirectUrl) {
        console.log("Redirecting to", redirectUrl);
        router.push(redirectUrl);
      }
    });
};

const resolveRedirectUrl = (notificationData: any) => {
  const { redirect, ...params } = notificationData;

  if (!redirect) {
    console.log(
      "No redirect type found in notification data",
      notificationData
    );
    return null;
  }

  const resolveFn = redirectConfig[redirect as keyof typeof redirectConfig];

  if (!resolveFn) {
    console.error("Unknown redirect type", redirect);
    return null;
  }

  try {
    return resolveFn(params);
  } catch (error) {
    console.error("Error resolving redirect URL", error);
    return null;
  }
};
