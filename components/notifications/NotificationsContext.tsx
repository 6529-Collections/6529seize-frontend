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
import { commonApiPost } from "@/services/api/common-api";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { getStableDeviceId } from "./stable-device-id";
import type { DevicePushData, PushRedirect } from "./device-push.types";

function parseDevicePushData(raw: unknown): DevicePushData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const notification_id = o["notification_id"];
  const redirect = o["redirect"];
  const target_profile_id = o["target_profile_id"];
  const target_profile_handle = o["target_profile_handle"];
  if (
    typeof notification_id !== "string" ||
    typeof redirect !== "string" ||
    typeof target_profile_id !== "string" ||
    typeof target_profile_handle !== "string"
  )
    return null;
  if (redirect !== "profile" && redirect !== "waves") return null;
  const data: DevicePushData = {
    notification_id,
    redirect: redirect as PushRedirect,
    target_profile_id,
    target_profile_handle,
  };
  const handle = o["handle"];
  if (typeof handle === "string") data.handle = handle;
  const subroute = o["subroute"];
  if (subroute === "rep" || subroute === "identity") data.subroute = subroute;
  const wave_id = o["wave_id"];
  if (typeof wave_id === "string") data.wave_id = wave_id;
  const drop_id = o["drop_id"];
  if (typeof drop_id === "string") data.drop_id = drop_id;
  return data;
}

const MAX_REGISTRATION_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 5000;
const IOS_INITIALIZATION_DELAY_MS = 500;
const PROFILE_SWITCH_SETTLE_TIMEOUT_MS = 3000;
const PROFILE_SWITCH_POLL_INTERVAL_MS = 50;
const PUSH_REGISTRATION_TOTAL_ATTEMPTS = 3;
const PUSH_REGISTRATION_BASE_DELAY_MS = 500;
const PUSH_REGISTRATION_MAX_DELAY_MS = 4000;
const PUSH_REGISTRATION_JITTER_FACTOR = 0.2;
const PUSH_REGISTRATION_MAX_RETRY_AFTER_MS = 10000;

const DELEGATE_ERROR_PATTERNS = [
  "capacitorDidRegisterForRemoteNotifications",
  "didRegisterForRemoteNotifications",
];

const PUSH_REGISTRATION_RETRY_MESSAGE_PATTERN =
  /(?:retry[-\s]?after|try again in)\s*(\d+)\s*(millisecond|milliseconds|ms|second|seconds|sec|s|minute|minutes|min|m)?/i;
const RATE_LIMIT_ERROR_PATTERNS = ["rate limit", "too many requests", "429"];
const TRANSIENT_ERROR_PATTERNS = [
  "failed to fetch",
  "load failed",
  "network request failed",
  "network error",
  "timeout",
];

type PushRegistrationFingerprint = {
  deviceId: string;
  token: string;
  profileId: string | null;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error) {
    const typedError = error as {
      message?: unknown;
      error?: unknown;
    };
    if (typeof typedError.message === "string") {
      return typedError.message;
    }
    if (typeof typedError.error === "string") {
      return typedError.error;
    }
  }
  return String(error);
};

const parseStatusCode = (status: unknown): number | null => {
  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }
  if (typeof status === "string") {
    const parsed = Number.parseInt(status, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const extractErrorStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== "object") {
    return null;
  }
  const typedError = error as {
    status?: unknown;
    code?: unknown;
    response?: {
      status?: unknown;
    };
  };

  return (
    parseStatusCode(typedError.status) ??
    parseStatusCode(typedError.response?.status) ??
    parseStatusCode(typedError.code)
  );
};

const parseRetryAfterHeaderValue = (value: string): number | null => {
  const seconds = Number.parseFloat(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const retryAt = Date.parse(value);
  if (!Number.isNaN(retryAt)) {
    return Math.max(0, retryAt - Date.now());
  }

  return null;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const extractRetryAfterFromHeaders = (headers: unknown): number | null => {
  if (headers instanceof Headers) {
    const retryAfter = headers.get("retry-after");
    return retryAfter ? parseRetryAfterHeaderValue(retryAfter) : null;
  }

  const typedHeaders = toRecord(headers);
  if (!typedHeaders) {
    return null;
  }

  const retryAfter =
    typedHeaders["retry-after"] ?? typedHeaders["Retry-After"] ?? null;
  if (typeof retryAfter === "string") {
    return parseRetryAfterHeaderValue(retryAfter);
  }

  return null;
};

const extractRetryAfterMs = (error: unknown): number | null => {
  if (error && typeof error === "object") {
    const typedError = error as {
      headers?: unknown;
      response?: {
        headers?: unknown;
      };
    };

    const retryAfterFromHeaders =
      extractRetryAfterFromHeaders(typedError.response?.headers) ??
      extractRetryAfterFromHeaders(typedError.headers);
    if (retryAfterFromHeaders !== null) {
      return Math.min(
        retryAfterFromHeaders,
        PUSH_REGISTRATION_MAX_RETRY_AFTER_MS
      );
    }
  }

  const message = toErrorMessage(error);
  const match = PUSH_REGISTRATION_RETRY_MESSAGE_PATTERN.exec(message);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const unit = (match[2] ?? "seconds").toLowerCase();
  let multiplier = 1000;
  if (unit.startsWith("m") && unit !== "ms" && unit !== "millisecond") {
    multiplier = 60_000;
  } else if (unit.startsWith("ms")) {
    multiplier = 1;
  } else if (unit.startsWith("millisecond")) {
    multiplier = 1;
  }

  return Math.min(value * multiplier, PUSH_REGISTRATION_MAX_RETRY_AFTER_MS);
};

const isRateLimitError = (error: unknown): boolean => {
  if (extractErrorStatusCode(error) === 429) {
    return true;
  }
  const normalizedMessage = toErrorMessage(error).toLowerCase();
  return RATE_LIMIT_ERROR_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern)
  );
};

const isTransientPushRegistrationError = (error: unknown): boolean => {
  if (isRateLimitError(error)) {
    return true;
  }

  const statusCode = extractErrorStatusCode(error);
  if (statusCode !== null) {
    return statusCode === 408 || (statusCode >= 500 && statusCode < 600);
  }

  const normalizedMessage = toErrorMessage(error).toLowerCase();
  return TRANSIENT_ERROR_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern)
  );
};

const computePushRegistrationRetryDelayMs = (
  attempt: number,
  retryAfterMs: number | null
): number => {
  if (retryAfterMs !== null) {
    return Math.max(0, retryAfterMs);
  }

  const baseDelay = Math.min(
    PUSH_REGISTRATION_BASE_DELAY_MS * Math.pow(2, attempt),
    PUSH_REGISTRATION_MAX_DELAY_MS
  );
  const jitterMultiplier =
    1 + (Math.random() * 2 - 1) * PUSH_REGISTRATION_JITTER_FACTOR;
  return Math.max(0, Math.round(baseDelay * jitterMultiplier));
};

const toCaptureExceptionInput = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(toErrorMessage(error));
};

const createPushRegistrationFingerprint = ({
  deviceId,
  token,
  profile,
}: {
  deviceId: string;
  token: string;
  profile?: ApiIdentity;
}): PushRegistrationFingerprint => ({
  deviceId,
  token,
  profileId: profile?.id ?? null,
});

const isSamePushRegistrationFingerprint = (
  left: PushRegistrationFingerprint,
  right: PushRegistrationFingerprint
): boolean =>
  left.deviceId === right.deviceId &&
  left.token === right.token &&
  left.profileId === right.profileId;

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
        await Promise.resolve(seizeSwitchConnectedAccount(matchedAddress));
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
      const raw = notification.data ?? {};
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

  const registerPushNotificationWithRetry = useCallback(
    async (
      deviceId: string,
      deviceInfo: DeviceInfo,
      token: string,
      profile?: ApiIdentity
    ): Promise<boolean> => {
      const profileId = profile?.id ?? null;

      for (
        let attempt = 0;
        attempt < PUSH_REGISTRATION_TOTAL_ATTEMPTS;
        attempt++
      ) {
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

          return true;
        } catch (error) {
          const attemptNumber = attempt + 1;
          const statusCode = extractErrorStatusCode(error);
          const rateLimited = isRateLimitError(error);
          const retryAfterMs = extractRetryAfterMs(error);
          const hasRetriesLeft =
            attemptNumber < PUSH_REGISTRATION_TOTAL_ATTEMPTS;
          const shouldRetry =
            hasRetriesLeft && isTransientPushRegistrationError(error);

          if (shouldRetry) {
            const delayMs = computePushRegistrationRetryDelayMs(
              attempt,
              retryAfterMs
            );

            console.warn("Push registration attempt failed. Retrying...", {
              attempt: attemptNumber,
              maxAttempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
              delayMs,
              rateLimited,
              statusCode,
              profileId,
            });
            Sentry.addBreadcrumb({
              category: "notifications",
              level: "warning",
              message: "Push registration attempt failed. Retrying.",
              data: {
                component: "NotificationsProvider",
                operation: "registerPushNotification",
                attempt: attemptNumber,
                max_attempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
                delay_ms: delayMs,
                rate_limited: rateLimited,
                status_code: statusCode ?? undefined,
                profile_id: profileId ?? undefined,
                platform: deviceInfo.platform,
              },
            });
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          if (rateLimited) {
            console.warn("Push registration rate limited", {
              attempt: attemptNumber,
              maxAttempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
              statusCode,
              profileId,
            });
            Sentry.addBreadcrumb({
              category: "notifications",
              level: "warning",
              message: "Push registration rate limited.",
              data: {
                component: "NotificationsProvider",
                operation: "registerPushNotification",
                attempt: attemptNumber,
                max_attempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
                delay_ms: retryAfterMs ?? undefined,
                status_code: statusCode ?? undefined,
                profile_id: profileId ?? undefined,
                platform: deviceInfo.platform,
              },
            });
            return false;
          }

          console.error("Push registration error", error);
          Sentry.captureException(toCaptureExceptionInput(error), {
            tags: {
              component: "NotificationsProvider",
              operation: "registerPushNotification",
            },
            extra: {
              attempt: attemptNumber,
              max_attempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
              status_code: statusCode ?? undefined,
              profile_id: profileId ?? undefined,
              platform: deviceInfo.platform,
            },
          });
          return false;
        }
      }

      return false;
    },
    []
  );

  const handlePushRegistration = useCallback(
    async (
      deviceId: string,
      deviceInfo: DeviceInfo,
      token: string,
      profile?: ApiIdentity
    ): Promise<void> => {
      const fingerprint = createPushRegistrationFingerprint({
        deviceId,
        token,
        profile,
      });
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
            profile_id: fingerprint.profileId ?? undefined,
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
              profile_id: fingerprint.profileId ?? undefined,
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
          profile
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

        await PushNotifications.addListener("registration", async (token) => {
          isRegisteredRef.current = true;
          await handlePushRegistration(
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

const resolveRedirectUrl = (notificationData: DevicePushData) => {
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
