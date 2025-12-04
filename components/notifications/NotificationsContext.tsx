"use client";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import useCapacitor from "@/hooks/useCapacitor";
import { commonApiPost } from "@/services/api/common-api";
import { Device, DeviceInfo } from "@capacitor/device";
import {
  PushNotifications,
  PushNotificationSchema,
} from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "../auth/Auth";
import { getStableDeviceId } from "./stable-device-id";

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
    const base = `/waves?wave=${wave_id}`;
    return drop_id ? `${base}&serialNo=${drop_id}` : base;
  },
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isCapacitor, isIos, isActive } = useCapacitor();
  const { connectedProfile } = useAuth();
  const router = useRouter();
  const initializationRef = useRef<string | null>(null);
  const registrationAttemptRef = useRef<number>(0);

  useEffect(() => {
    const profileId = connectedProfile?.id ?? null;
    if (isCapacitor && isActive && initializationRef.current !== profileId) {
      initializationRef.current = profileId;
      registrationAttemptRef.current = 0;
      initializeNotifications(connectedProfile ?? undefined);
    }
  }, [connectedProfile, isCapacitor, isActive]);

  const initializeNotifications = async (profile?: ApiIdentity) => {
    try {
      if (isCapacitor) {
        console.log("Initializing push notifications");
        await initializePushNotifications(profile);
      }
    } catch (error) {
      console.error("Error initializing notifications", error);
      throw error;
    }
  };

  const registerWithRetry = async (maxRetries = 3): Promise<void> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await PushNotifications.register();
        registrationAttemptRef.current = 0;
        return;
      } catch (registerError: any) {
        const errorMessage = registerError?.message || String(registerError);
        const isDelegateError =
          errorMessage.includes("capacitorDidRegisterForRemoteNotifications") ||
          errorMessage.includes("didRegisterForRemoteNotifications");

        if (isDelegateError && attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.warn(
            `iOS push notification registration attempt ${
              attempt + 1
            } failed. Retrying in ${delay}ms...`,
            registerError
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw registerError;
      }
    }
  };

  const initializePushNotifications = async (profile?: ApiIdentity) => {
    try {
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
        if (isIos) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        await registerWithRetry();
      } else {
        console.warn("Push notifications permission not granted");
      }
    } catch (error) {
      console.error("Error in initializePushNotifications", error);
      throw error;
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
