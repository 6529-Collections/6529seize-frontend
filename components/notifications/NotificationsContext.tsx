"use client";

import { Device, type DeviceInfo } from "@capacitor/device";
import {
  PushNotifications,
  type PushNotificationSchema,
} from "@capacitor/push-notifications";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { getUserPageTabByRoute } from "@/components/user/layout/userTabs.config";
import { type ApiIdentity } from "@/generated/models/ApiIdentity";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { getStableDeviceId } from "./stable-device-id";

const MAX_REGISTRATION_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 5000;
const IOS_INITIALIZATION_DELAY_MS = 500;

const DELEGATE_ERROR_PATTERNS = [
  "capacitorDidRegisterForRemoteNotifications",
  "didRegisterForRemoteNotifications",
];

const isDelegateError = (error: unknown): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return DELEGATE_ERROR_PATTERNS.some((pattern) =>
    errorMessage.includes(pattern)
  );
};

const registerWithRetry = async (
  maxRetries = MAX_REGISTRATION_RETRIES
): Promise<void> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await PushNotifications.register();
      return;
    } catch (registerError: unknown) {
      const isDelegate = isDelegateError(registerError);
      const hasRetriesLeft = attempt < maxRetries - 1;

      if (isDelegate && hasRetriesLeft) {
        const delay = Math.min(
          INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt),
          MAX_RETRY_DELAY_MS
        );
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

type NotificationsContextType = {
  removeWaveDeliveredNotifications: (waveId: string) => Promise<void>;
  removeAllDeliveredNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const redirectConfig = {
  path: ({ path }: { path: string }) => `/${path}`,
  profile: ({ handle, subroute }: { handle: string; subroute?: string }) => {
    if (!subroute) return `/${handle}`;
    const validTab = getUserPageTabByRoute(subroute);
    if (!validTab) return `/${handle}`;
    return `/${handle}/${validTab.route}`;
  },
  "the-memes": ({ id }: { id: string }) => `/the-memes/${id}`,
  "6529-gradient": ({ id }: { id: string }) => `/6529-gradient/${id}`,
  "meme-lab": ({ id }: { id: string }) => `/meme-lab/${id}`,
  waves: ({ wave_id, drop_id }: { wave_id: string; drop_id: string }) => {
    return getWaveRoute({
      waveId: wave_id,
      serialNo: drop_id || undefined,
      isDirectMessage: false,
      isApp: false,
    });
  },
};

interface NotificationData {
  redirect?: keyof typeof redirectConfig | undefined;
  profile_id?: string | undefined;
  path?: string | undefined;
  handle?: string | undefined;
  subroute?: string | undefined;
  id?: string | undefined;
  wave_id?: string | undefined;
  drop_id?: string | undefined;
  [key: string]: unknown;
}

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isCapacitor, isIos, isActive } = useCapacitor();
  const { connectedProfile } = useAuth();
  const { address, connectedAccounts, seizeSwitchConnectedAccount } =
    useSeizeConnectContext();
  const router = useRouter();
  const initializationRef = useRef<string | null>(null);
  const isRegisteredRef = useRef(false);
  const connectedProfileRef = useRef<ApiIdentity | null>(connectedProfile);
  const connectedAccountsRef = useRef(connectedAccounts);
  const activeAddressRef = useRef(address);

  useEffect(() => {
    connectedProfileRef.current = connectedProfile;
  }, [connectedProfile]);

  useEffect(() => {
    connectedAccountsRef.current = connectedAccounts;
  }, [connectedAccounts]);

  useEffect(() => {
    activeAddressRef.current = address;
  }, [address]);

  const removeDeliveredNotifications = useCallback(
    async (notifications: PushNotificationSchema[]) => {
      if (isIos && isRegisteredRef.current) {
        try {
          await PushNotifications.removeDeliveredNotifications({
            notifications,
          });
        } catch (error) {
          console.error("Error removing delivered notifications", error);
        }
      }
    },
    [isIos]
  );

  const resolveAddressForNotificationProfile = useCallback(
    async (notificationProfileId: string): Promise<string | null> => {
      if (
        connectedProfileRef.current?.id === notificationProfileId &&
        activeAddressRef.current
      ) {
        return activeAddressRef.current;
      }

      const roleMatchedAccount = connectedAccountsRef.current.find(
        (account) => account.role === notificationProfileId
      );
      if (roleMatchedAccount) {
        return roleMatchedAccount.address;
      }

      const lookupResults = await Promise.all(
        connectedAccountsRef.current.map(async (account) => {
          try {
            const identity = await commonApiFetch<ApiIdentity>({
              endpoint: `identities/${account.address.toLowerCase()}`,
            });
            return identity.id === notificationProfileId ? account.address : null;
          } catch {
            return null;
          }
        })
      );

      return (
        lookupResults.find((resolved): resolved is string => !!resolved) ?? null
      );
    },
    []
  );

  const switchToMatchedAddress = useCallback(
    async (
      notificationProfileId: string,
      matchedAddress: string
    ): Promise<boolean> => {
      if (
        activeAddressRef.current?.toLowerCase() === matchedAddress.toLowerCase()
      ) {
        return true;
      }

      try {
        await Promise.resolve(seizeSwitchConnectedAccount(matchedAddress));
        return true;
      } catch (error) {
        console.warn(
          "Ignoring notification: failed to switch to matched connected profile",
          { notificationProfileId, matchedAddress, error }
        );
        return false;
      }
    },
    [seizeSwitchConnectedAccount]
  );

  const handlePushNotificationAction = useCallback(
    async (
      routerInstance: ReturnType<typeof useRouter>,
      notification: PushNotificationSchema
    ) => {
      const notificationData = notification.data ?? {};
      const notificationProfileId =
        typeof notificationData.profile_id === "string"
          ? notificationData.profile_id
          : null;

      if (notificationProfileId) {
        const matchedAddress =
          await resolveAddressForNotificationProfile(notificationProfileId);

        if (!matchedAddress) {
          console.warn(
            "Ignoring notification: profile is not one of connected accounts",
            { notificationProfileId }
          );
          return;
        }

        const didSwitch = await switchToMatchedAddress(
          notificationProfileId,
          matchedAddress
        );
        if (!didSwitch) {
          return;
        }
      }

      await removeDeliveredNotifications([notification]);

      const redirectUrl = resolveRedirectUrl(notificationData);
      if (redirectUrl) {
        routerInstance.push(redirectUrl);
      } else {
        console.warn(
          "No redirect url found in notification data",
          notificationData
        );
      }
    },
    [
      removeDeliveredNotifications,
      resolveAddressForNotificationProfile,
      switchToMatchedAddress,
    ]
  );

  const initializePushNotifications = useCallback(
    async (profile?: ApiIdentity) => {
      try {
        isRegisteredRef.current = false;
        await PushNotifications.removeAllListeners();

        const stableDeviceId = await getStableDeviceId();

        const deviceInfo = await Device.getInfo();

        await PushNotifications.addListener("registration", async (token) => {
          isRegisteredRef.current = true;
          await registerPushNotification(
            stableDeviceId,
            deviceInfo,
            token.value,
            profile
          );
        });

        await PushNotifications.addListener("registrationError", (error) => {
          isRegisteredRef.current = false;
          console.error("Push registration error: ", error);
          Sentry.captureException(error, {
            tags: {
              component: "NotificationsProvider",
              operation: "pushRegistrationError",
            },
          });
        });

        await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.warn("Push notification received: ", notification);
          }
        );

        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          async (action) => {
            await handlePushNotificationAction(router, action.notification);
          }
        );

        const permStatus = await PushNotifications.requestPermissions();

        if (permStatus.receive === "granted") {
          if (isIos) {
            await new Promise((resolve) =>
              setTimeout(resolve, IOS_INITIALIZATION_DELAY_MS)
            );
          }
          await registerWithRetry();
        } else {
          console.warn("Push notifications permission not granted");
        }
      } catch (error) {
        console.error("Error in initializePushNotifications", error);
        throw error;
      }
    },
    [isIos, router, handlePushNotificationAction]
  );

  const initializeNotifications = useCallback(
    async (profile?: ApiIdentity) => {
      if (isCapacitor) {
        await initializePushNotifications(profile);
      }
    },
    [isCapacitor, initializePushNotifications]
  );

  useEffect(() => {
    const profileId = connectedProfile?.id ?? null;
    if (isCapacitor && isActive && initializationRef.current !== profileId) {
      initializationRef.current = profileId;
      initializeNotifications(connectedProfile ?? undefined).catch((error) => {
        console.error("Failed to initialize push notifications", error);
        Sentry.captureException(error, {
          tags: {
            component: "NotificationsProvider",
            operation: "initializeNotifications",
          },
        });
        initializationRef.current = null;
      });
    }
  }, [connectedProfile, isCapacitor, isActive, initializeNotifications]);

  const removeWaveDeliveredNotifications = useCallback(
    async (waveId: string) => {
      if (isIos && isRegisteredRef.current) {
        try {
          const deliveredNotifications =
            await PushNotifications.getDeliveredNotifications();
          const waveNotifications = deliveredNotifications.notifications.filter(
            (notification) => notification.data?.wave_id === waveId
          );
          await removeDeliveredNotifications(waveNotifications);
        } catch (error) {
          console.error("Error removing wave delivered notifications", error);
          Sentry.captureException(error, {
            tags: {
              component: "NotificationsProvider",
              operation: "removeWaveDeliveredNotifications",
            },
          });
        }
      }
    },
    [isIos, removeDeliveredNotifications]
  );

  const removeAllDeliveredNotifications = useCallback(async () => {
    if (isIos && isRegisteredRef.current) {
      try {
        await PushNotifications.removeAllDeliveredNotifications();
      } catch (error) {
        console.error("Error removing all delivered notifications", error);
        Sentry.captureException(error, {
          tags: {
            component: "NotificationsProvider",
            operation: "removeAllDeliveredNotifications",
          },
        });
      }
    }
  }, [isIos]);

  const value = useMemo(
    () => ({
      removeWaveDeliveredNotifications,
      removeAllDeliveredNotifications,
    }),
    [removeWaveDeliveredNotifications, removeAllDeliveredNotifications]
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
    await commonApiPost({
      endpoint: `push-notifications/register`,
      body: {
        device_id: deviceId,
        token,
        platform: deviceInfo.platform,
        profile_id: profile?.id,
      },
    });
  } catch (error) {
    console.error("Push registration error", error);
    Sentry.captureException(error, {
      tags: {
        component: "NotificationsProvider",
        operation: "registerPushNotification",
      },
    });
  }
};

const resolveRedirectUrl = (notificationData: NotificationData) => {
  const { redirect, ...params } = notificationData;

  if (!redirect) {
    console.warn(
      "No redirect type found in notification data",
      notificationData
    );
    return null;
  }

  const resolveFn = redirectConfig[redirect];

  if (!resolveFn) {
    console.error("Unknown redirect type", redirect);
    return null;
  }

  try {
    return (resolveFn as (params: Record<string, unknown>) => string)(params);
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
