"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { resolvePushNotificationRedirectUrl } from "@/helpers/push-notification.helpers";

type NotificationsContextType = {
  removeWaveDeliveredNotifications: (waveId: string) => Promise<void>;
  removeAllDeliveredNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

let pushLaunchHandled = false;

export const NotificationsGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isCapacitor, isIos } = useCapacitor();
  const { connectedProfile } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(!isCapacitor || pushLaunchHandled);

  useEffect(() => {
    if (!isCapacitor || pushLaunchHandled) return;

    console.log("Running push notification gate on app launch...");

    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log("No launch notification detected after timeout.");
        pushLaunchHandled = true;
        setReady(true);
      }
    }, 1000);

    const listenerPromise = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      async (action) => {
        resolved = true;
        clearTimeout(timeout);

        console.log("Notification tap action performed:", action);

        await handlePushNotificationAction(
          router,
          action.notification,
          connectedProfile
        );

        pushLaunchHandled = true;
        setReady(true);
      }
    );

    return () => {
      clearTimeout(timeout);
      listenerPromise.then((handle) => handle.remove());
    };
  }, [isCapacitor, connectedProfile, router]);

  // Run your normal push setup always:
  useEffect(() => {
    if (!isCapacitor) return;

    initializeNotifications(connectedProfile ?? undefined);
  }, [connectedProfile, isCapacitor]);

  const initializeNotifications = async (profile?: ApiIdentity) => {
    try {
      console.log("Initializing push notifications");
      await initializePushNotifications(profile);
    } catch (error) {
      console.error("Error initializing notifications", error);
    }
  };

  const initializePushNotifications = async (profile?: ApiIdentity) => {
    await PushNotifications.removeAllListeners();

    const stableDeviceId = await getStableDeviceId();
    const deviceInfo = await Device.getInfo();

    PushNotifications.addListener("registration", async (token) => {
      await registerPushNotification(
        stableDeviceId,
        deviceInfo,
        token.value,
        profile
      );
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
    profile?: ApiIdentity | null
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

    const redirectUrl = resolvePushNotificationRedirectUrl(notificationData);
    if (redirectUrl) {
      console.log("Redirecting to", redirectUrl);
      router.replace(redirectUrl);
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
        await PushNotifications.removeDeliveredNotifications({
          notifications,
        });
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

  if (!ready) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen tw-w-screen tw-bg-black tw-text-white tw-text-2xl tw-font-bold">
        Splash screen...
      </div>
    );
  }

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

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotificationsContext must be used within a NotificationsProvider"
    );
  }
  return context;
};
