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
  useReducer,
  useRef,
} from "react";
import { getUserPageTabByRoute } from "@/components/user/layout/userTabs.config";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  isAuthJwtUsable,
} from "@/services/auth/auth.utils";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { getStableDeviceId } from "./stable-device-id";
import type { DevicePushData } from "./device-push.types";
import {
  IOS_INITIALIZATION_DELAY_MS,
  PROFILE_SWITCH_POLL_INTERVAL_MS,
  PROFILE_SWITCH_SETTLE_TIMEOUT_MS,
  createErrorTelemetryExtra,
  createPushRegistrationFingerprint,
  extractErrorStatusCode,
  isKnownLowValuePushRegistrationError,
  isSamePushRegistrationFingerprint,
  isTransientPushRegistrationError,
  parseDevicePushData,
  registerPushNotificationWithRetry,
  registerWithRetry,
  requestPushNotificationPermissions,
  toCaptureExceptionInput,
  toRecord,
  type PushRegistrationFingerprint,
} from "./notificationsPushRegistration";

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

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isCapacitor, isIos, isActive } = useCapacitor();
  const { connectedProfile } = useAuth();
  const forceAuthTokenRefresh = useReducer(
    (revision: number) => revision + 1,
    0
  )[1];
  const authJwt = getAuthJwt();
  const pushRegistrationAuthKey = isAuthJwtUsable(authJwt)
    ? getAuthTokenFingerprint(authJwt)
    : "no-usable-auth";
  const { address, connectedAccounts, seizeSwitchConnectedAccount } =
    useSeizeConnectContext();
  const router = useRouter();
  const initializationRef = useRef<string | null>(null);
  const isRegisteredRef = useRef(false);
  const lastSuccessfulRegistrationRef =
    useRef<PushRegistrationFingerprint | null>(null);
  const inFlightRegistrationRef = useRef<Promise<void> | null>(null);
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

  useEffect(() => {
    if (typeof globalThis.addEventListener !== "function") {
      return;
    }

    const handleAuthTokenChanged = () => {
      forceAuthTokenRefresh();
    };

    globalThis.addEventListener(
      AUTH_TOKEN_CHANGED_EVENT,
      handleAuthTokenChanged
    );
    return () => {
      globalThis.removeEventListener(
        AUTH_TOKEN_CHANGED_EVENT,
        handleAuthTokenChanged
      );
    };
  }, [forceAuthTokenRefresh]);

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
    ({
      target_profile_id,
      target_profile_handle,
    }: Pick<DevicePushData, "target_profile_id" | "target_profile_handle">):
      | string
      | null => {
      if (
        connectedProfileRef.current?.id === target_profile_id &&
        activeAddressRef.current
      ) {
        return activeAddressRef.current;
      }

      const profileMatchedAccount = connectedAccountsRef.current.find(
        (account) => account.profileId === target_profile_id
      );
      if (profileMatchedAccount) {
        return profileMatchedAccount.address;
      }

      const roleMatchedAccount = connectedAccountsRef.current.find(
        (account) => account.role === target_profile_id
      );
      if (roleMatchedAccount) {
        return roleMatchedAccount.address;
      }

      const normalizedHandle = target_profile_handle.toLowerCase();
      const handleMatchedAccount = connectedAccountsRef.current.find(
        (account) => account.profileHandle?.toLowerCase() === normalizedHandle
      );
      if (handleMatchedAccount) {
        return handleMatchedAccount.address;
      }

      return null;
    },
    []
  );

  const switchToMatchedAddress = useCallback(
    async (
      notificationProfileId: string,
      matchedAddress: string
    ): Promise<boolean> => {
      const isMatchedProfileActive = (): boolean => {
        const activeAddress = activeAddressRef.current;
        if (!activeAddress) {
          return false;
        }

        const normalizedActiveAddress = activeAddress.toLowerCase();
        const normalizedMatchedAddress = matchedAddress.toLowerCase();
        if (normalizedActiveAddress !== normalizedMatchedAddress) {
          return false;
        }

        return connectedProfileRef.current?.id === notificationProfileId;
      };

      const waitForProfileSwitchSettlement = async (): Promise<boolean> => {
        const timeoutAt = Date.now() + PROFILE_SWITCH_SETTLE_TIMEOUT_MS;

        while (Date.now() < timeoutAt) {
          if (isMatchedProfileActive()) {
            return true;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, PROFILE_SWITCH_POLL_INTERVAL_MS)
          );
        }

        return isMatchedProfileActive();
      };

      if (isMatchedProfileActive()) {
        return true;
      }

      if (
        activeAddressRef.current?.toLowerCase() === matchedAddress.toLowerCase()
      ) {
        return await waitForProfileSwitchSettlement();
      }

      try {
        seizeSwitchConnectedAccount(matchedAddress);
        const didSettle = await waitForProfileSwitchSettlement();
        if (!didSettle) {
          console.warn(
            "Ignoring notification: switched wallet account but profile did not settle in time",
            { notificationProfileId, matchedAddress }
          );
        }
        return didSettle;
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
      const raw: unknown = notification.data ?? {};
      const notificationData = parseDevicePushData(raw);
      if (!notificationData) {
        await removeDeliveredNotifications([notification]);
        console.warn("Ignoring notification: invalid payload shape", { raw });
        return;
      }
      const targetProfileId = notificationData.target_profile_id.trim();
      const targetProfileHandle = notificationData.target_profile_handle.trim();

      if (targetProfileId.length === 0 || targetProfileHandle.length === 0) {
        await removeDeliveredNotifications([notification]);
        console.warn("Ignoring notification: missing target profile metadata", {
          targetProfileId,
          targetProfileHandle,
        });
        return;
      }

      const matchedAddress = resolveAddressForNotificationProfile({
        target_profile_id: targetProfileId,
        target_profile_handle: targetProfileHandle,
      });

      if (!matchedAddress) {
        await removeDeliveredNotifications([notification]);
        console.warn(
          "Ignoring notification: target profile is not one of connected accounts",
          { targetProfileId, targetProfileHandle }
        );
        return;
      }

      const didSwitch = await switchToMatchedAddress(
        targetProfileId,
        matchedAddress
      );
      if (!didSwitch) {
        return;
      }

      await removeDeliveredNotifications([notification]);

      const { handle: rawHandle, ...notificationDataWithoutHandle } =
        notificationData;
      const handle = typeof rawHandle === "string" ? rawHandle.trim() : "";
      const redirectData: DevicePushData = handle
        ? { ...notificationDataWithoutHandle, handle }
        : notificationDataWithoutHandle;
      const redirectUrl = resolveRedirectUrl(redirectData);
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

  const handlePushRegistration = useCallback(
    async (
      deviceId: string,
      deviceInfo: DeviceInfo,
      token: string,
      profile?: ApiIdentity
    ): Promise<void> => {
      const fingerprintInput: {
        deviceId: string;
        token: string;
        profile?: ApiIdentity;
      } = {
        deviceId,
        token,
      };
      if (profile !== undefined) {
        fingerprintInput.profile = profile;
      }

      const fingerprint = createPushRegistrationFingerprint(fingerprintInput);
      const profileId = fingerprint.profileId;
      if (profileId === null) {
        console.warn("Skipping push registration: profile id is unavailable", {
          platform: deviceInfo.platform,
        });
        Sentry.addBreadcrumb({
          category: "notifications",
          level: "warning",
          message: "Push registration skipped (profile id unavailable).",
          data: {
            component: "NotificationsProvider",
            operation: "registerPushNotification",
            platform: deviceInfo.platform,
          },
        });
        return;
      }

      const previousSuccess = lastSuccessfulRegistrationRef.current;

      if (
        previousSuccess &&
        isSamePushRegistrationFingerprint(previousSuccess, fingerprint)
      ) {
        Sentry.addBreadcrumb({
          category: "notifications",
          level: "info",
          message: "Push registration skipped (already registered in session).",
          data: {
            component: "NotificationsProvider",
            operation: "registerPushNotification",
            profile_id: profileId,
            platform: deviceInfo.platform,
          },
        });
        return;
      }

      if (inFlightRegistrationRef.current) {
        await inFlightRegistrationRef.current;
        const latestSuccess = lastSuccessfulRegistrationRef.current;
        if (
          latestSuccess &&
          isSamePushRegistrationFingerprint(latestSuccess, fingerprint)
        ) {
          Sentry.addBreadcrumb({
            category: "notifications",
            level: "info",
            message:
              "Push registration skipped (already handled by in-flight registration).",
            data: {
              component: "NotificationsProvider",
              operation: "registerPushNotification",
              profile_id: profileId,
              platform: deviceInfo.platform,
            },
          });
          return;
        }
      }

      const registrationTask = (async () => {
        const didRegister = await registerPushNotificationWithRetry(
          deviceId,
          deviceInfo,
          token,
          profileId
        );
        if (didRegister) {
          lastSuccessfulRegistrationRef.current = fingerprint;
        }
      })();

      inFlightRegistrationRef.current = registrationTask;
      try {
        await registrationTask;
      } finally {
        if (inFlightRegistrationRef.current === registrationTask) {
          inFlightRegistrationRef.current = null;
        }
      }
    },
    [registerPushNotificationWithRetry]
  );

  const initializePushNotifications = useCallback(
    async (profile?: ApiIdentity) => {
      try {
        isRegisteredRef.current = false;
        await PushNotifications.removeAllListeners();

        const stableDeviceId = await getStableDeviceId();

        const deviceInfo = await Device.getInfo();

        await PushNotifications.addListener("registration", (token) => {
          isRegisteredRef.current = true;
          void (async () => {
            try {
              await handlePushRegistration(
                stableDeviceId,
                deviceInfo,
                token.value,
                profile
              );
            } catch (error: unknown) {
              console.error("Push registration listener error", error);
              Sentry.captureException(
                toCaptureExceptionInput(
                  error,
                  "Push notification registration listener failed"
                ),
                {
                  tags: {
                    component: "NotificationsProvider",
                    operation: "pushRegistrationListener",
                  },
                  extra: createErrorTelemetryExtra(error),
                }
              );
            }
          })();
        });

        await PushNotifications.addListener("registrationError", (error) => {
          isRegisteredRef.current = false;
          const statusCode = extractErrorStatusCode(error);
          const errorExtra = createErrorTelemetryExtra(error);

          if (isKnownLowValuePushRegistrationError(error)) {
            console.warn("Known low-value push registration error", {
              statusCode,
              ...errorExtra,
            });
            Sentry.addBreadcrumb({
              category: "notifications",
              level: "info",
              message: "Push registration low-value native error.",
              data: {
                component: "NotificationsProvider",
                operation: "pushRegistrationError",
                retryable: false,
                known_low_value: true,
                ...errorExtra,
              },
            });
            return;
          }

          if (isTransientPushRegistrationError(error)) {
            console.warn("Transient push registration error", {
              statusCode,
              ...errorExtra,
            });
            Sentry.addBreadcrumb({
              category: "notifications",
              level: "warning",
              message: "Push registration transient error.",
              data: {
                component: "NotificationsProvider",
                operation: "pushRegistrationError",
                retryable: true,
                ...errorExtra,
              },
            });
            return;
          }

          console.error("Push registration error: ", error);
          Sentry.captureException(
            toCaptureExceptionInput(
              error,
              "Push notification registration failed"
            ),
            {
              tags: {
                component: "NotificationsProvider",
                operation: "pushRegistrationError",
              },
              extra: {
                retryable: false,
                ...errorExtra,
              },
            }
          );
        });

        await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.warn("Push notification received: ", notification);
          }
        );

        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            void (async () => {
              try {
                await handlePushNotificationAction(router, action.notification);
              } catch (error: unknown) {
                console.error("Push notification action error", error);
                Sentry.captureException(
                  toCaptureExceptionInput(
                    error,
                    "Push notification action failed"
                  ),
                  {
                    tags: {
                      component: "NotificationsProvider",
                      operation: "pushNotificationActionPerformed",
                    },
                    extra: createErrorTelemetryExtra(error),
                  }
                );
              }
            })();
          }
        );

        const permStatus = await requestPushNotificationPermissions(isIos);

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
    [isIos, router, handlePushNotificationAction, handlePushRegistration]
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
    const initializationKey = `${
      profileId ?? "no-profile"
    }:${pushRegistrationAuthKey}`;
    if (
      isCapacitor &&
      isActive &&
      initializationRef.current !== initializationKey
    ) {
      initializationRef.current = initializationKey;
      void (async () => {
        try {
          await initializeNotifications(connectedProfile ?? undefined);
        } catch (error: unknown) {
          console.error("Failed to initialize push notifications", error);
          Sentry.captureException(
            toCaptureExceptionInput(
              error,
              "Failed to initialize push notifications"
            ),
            {
              tags: {
                component: "NotificationsProvider",
                operation: "initializeNotifications",
              },
              extra: createErrorTelemetryExtra(error),
            }
          );
          if (initializationRef.current === initializationKey) {
            initializationRef.current = null;
          }
        }
      })();
    }
  }, [
    connectedProfile,
    isCapacitor,
    isActive,
    initializeNotifications,
    pushRegistrationAuthKey,
  ]);

  const removeWaveDeliveredNotifications = useCallback(
    async (waveId: string) => {
      if (isIos && isRegisteredRef.current) {
        try {
          const deliveredNotifications =
            await PushNotifications.getDeliveredNotifications();
          const waveNotifications = deliveredNotifications.notifications.filter(
            (notification) =>
              toRecord(notification.data)?.["wave_id"] === waveId
          );
          await removeDeliveredNotifications(waveNotifications);
        } catch (error) {
          console.error("Error removing wave delivered notifications", error);
          Sentry.captureException(
            toCaptureExceptionInput(
              error,
              "Failed to remove wave delivered notifications"
            ),
            {
              tags: {
                component: "NotificationsProvider",
                operation: "removeWaveDeliveredNotifications",
              },
              extra: createErrorTelemetryExtra(error),
            }
          );
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
        Sentry.captureException(
          toCaptureExceptionInput(
            error,
            "Failed to remove all delivered notifications"
          ),
          {
            tags: {
              component: "NotificationsProvider",
              operation: "removeAllDeliveredNotifications",
            },
            extra: createErrorTelemetryExtra(error),
          }
        );
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

const resolveRedirectUrl = (notificationData: DevicePushData) => {
  const { redirect, ...params } = notificationData;

  const resolveFn = redirectConfig[redirect];

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
