"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import {
  PushNotifications,
  PushNotificationSchema,
} from "@capacitor/push-notifications";
import { Device, DeviceInfo } from "@capacitor/device";
import { useRouter } from "next/navigation";
import useCapacitor from "../../hooks/useCapacitor";
import { useAuth } from "../auth/Auth";
import { commonApiPost } from "../../services/api/common-api";
import { getStableDeviceId } from "./stable-device-id";
import { ApiIdentity } from "../../generated/models/ApiIdentity";

type NotificationsContextType = {
  removeWaveDeliveredNotifications: (waveId: string) => Promise<void>;
  removeAllDeliveredNotifications: () => Promise<void>;
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
    let base = `/my-stream?wave=${wave_id}`;
    return drop_id ? `${base}&serialNo=${drop_id}` : base;
  },
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isCapacitor, isIos } = useCapacitor();
  const { connectedProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    initializeNotifications(connectedProfile ?? undefined);
  }, [connectedProfile]);

  const initializeNotifications = async (profile?: ApiIdentity) => {
    try {
      if (isCapacitor) {
        console.log("Initializing push notifications");
        await initializePushNotifications(profile);
      }
    } catch (error) {
      console.error("Error initializing notifications", error);
    }
  };

  const initializePushNotifications = async (profile?: ApiIdentity) => {
    await PushNotifications.removeAllListeners();

    const stableDeviceId = await getStableDeviceId();

    const deviceInfo = await Device.getInfo();

    await PushNotifications.addListener("registration", async (token) => {
      registerPushNotification(
        stableDeviceId,
        deviceInfo,
        token.value,
        profile
      );
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error: ", error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push notification received: ", notification);
      }
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      async (action) => {
        await handlePushNotificationAction(
          router,
          action.notification,
          profile
        );
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

  const handlePushNotificationAction = async (
    router: ReturnType<typeof useRouter>,
    notification: PushNotificationSchema,
    profile?: ApiIdentity
  ) => {
    console.log("Push notification action performed", notification);
    const notificationData = notification.data;
    const notificationProfileId = notificationData.profile_id;

    if (
      profile &&
      notificationProfileId &&
      notificationProfileId !== profile.id
    ) {
      console.log("Notification profile id does not match connected profile");
      return;
    }

    void removeDeliveredNotifications([notification]);

    const redirectUrl = resolveRedirectUrl(notificationData);
    if (redirectUrl) {
      console.log("Redirecting to", redirectUrl);
      router.push(redirectUrl);
    } else {
      console.log(
        "No redirect url found in notification data",
        notificationData
      );
    }
  };

  const removeDeliveredNotifications = async (
    notifications: PushNotificationSchema[]
  ) => {
    if (isIos) {
      try {
        await PushNotifications.removeDeliveredNotifications({ notifications });
      } catch (error) {
        console.error("Error removing delivered notifications", error);
      }
    }
  };

  const removeWaveDeliveredNotifications = async (waveId: string) => {
    if (isIos) {
      const deliveredNotifications =
        await PushNotifications.getDeliveredNotifications();
      const waveNotifications = deliveredNotifications.notifications.filter(
        (notification) => notification.data.wave_id === waveId
      );
      await removeDeliveredNotifications(waveNotifications);
    }
  };

  const removeAllDeliveredNotifications = async () => {
    if (isIos) {
      try {
        await PushNotifications.removeAllDeliveredNotifications();
      } catch (error) {
        console.error("Error removing all delivered notifications", error);
      }
    }
  };

  const value = useMemo(
    () => ({
      removeWaveDeliveredNotifications,
      removeAllDeliveredNotifications,
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
  deviceId: string,
  deviceInfo: DeviceInfo,
  token: string,
  profile?: ApiIdentity
) => {
  try {
    const response = await commonApiPost({
      endpoint: `push-notifications/register`,
      body: {
        device_id: deviceId,
        token,
        platform: deviceInfo.platform,
        profile_id: profile?.id,
      },
    });
    console.log("Push registration success", response);
  } catch (error) {
    console.error("Push registration error", error);
  }
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

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotificationsContext must be used within a NotificationsProvider"
    );
  }
  return context;
};
