"use client";

import { type DeviceInfo } from "@capacitor/device";
import {
  PushNotifications,
  type PermissionStatus,
} from "@capacitor/push-notifications";
import * as Sentry from "@sentry/nextjs";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";
import { extractErrorStatusCode as extractSharedErrorStatusCode } from "@/utils/errorStatus";
import type { DevicePushData, PushRedirect } from "./device-push.types";

function parseDevicePushData(raw: unknown): DevicePushData | null {
  if (raw === null || raw === undefined || typeof raw !== "object") return null;
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
export const IOS_INITIALIZATION_DELAY_MS = 500;
const PROFILE_SWITCH_SETTLE_TIMEOUT_MS = 3000;
const PROFILE_SWITCH_POLL_INTERVAL_MS = 50;
const PUSH_REGISTRATION_TOTAL_ATTEMPTS = 3;
const PUSH_REGISTRATION_BASE_DELAY_MS = 500;
const PUSH_REGISTRATION_MAX_DELAY_MS = 4000;
const PUSH_REGISTRATION_JITTER_FACTOR = 0.2;
const UINT32_RANGE = 0x1_0000_0000;
const PUSH_REGISTRATION_MAX_RETRY_AFTER_MS = 10000;
// Capacitor omits the native domain/code, so keep this limited to the exact
// production signature instead of suppressing similar helper failures.
const IOS_PUSH_PERMISSION_HELPER_APPLICATION_ERROR_MESSAGE =
  "Couldn’t communicate with a helper application.";

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
  "network connection was lost",
  "network request failed",
  "network error",
  "server with the specified hostname could not be found",
  "too many server requests",
  "timed out",
  "timeout",
];
const PERMANENT_PUSH_REGISTRATION_ERROR_PATTERNS = [
  "permission denied",
  "permission not granted",
  "not authorized",
  "unauthorized",
  "invalid configuration",
  "configuration is invalid",
  "invalid token",
  "invalid device token",
  "token is invalid",
];
const LOW_VALUE_PUSH_REGISTRATION_ERROR_PATTERNS = [
  "com.google.iid error -25291",
  "com.google.iid error -25299",
];
const LOW_VALUE_PUSH_REGISTRATION_ERROR_DOMAIN = "com.google.iid";
const LOW_VALUE_PUSH_REGISTRATION_ERROR_CODE_STRINGS = new Set([
  "-25291",
  "-25299",
]);

export type PushRegistrationFingerprint = {
  deviceId: string;
  token: string;
  profileId: string | null;
};

type ErrorTelemetryExtra = {
  error_message: string;
  error_name?: string;
  error_code?: string | number;
  status_code?: number;
};

const getStringErrorField = (
  record: Record<string, unknown>,
  field: string
): string | null => {
  const value = record[field];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (value instanceof Error && value.message.trim()) {
    return value.message.trim();
  }
  if (value !== null && typeof value === "object") {
    const nestedRecord = value as Record<string, unknown>;
    const nestedMessage = nestedRecord["message"];
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage.trim();
    }
  }
  return null;
};

const toErrorMessage = (
  error: unknown,
  fallbackMessage = "Unknown notification error"
): string => {
  if (error instanceof Error) {
    return error.message.trim() || fallbackMessage;
  }
  if (typeof error === "string") {
    return error.trim() || fallbackMessage;
  }
  if (error === null || error === undefined) {
    return fallbackMessage;
  }
  if (typeof error === "object") {
    const typedError = error as Record<string, unknown>;
    const extractedMessage =
      getStringErrorField(typedError, "message") ??
      getStringErrorField(typedError, "error") ??
      getStringErrorField(typedError, "reason") ??
      getStringErrorField(typedError, "localizedDescription") ??
      getStringErrorField(typedError, "description");
    if (extractedMessage !== null) {
      return extractedMessage;
    }
    return fallbackMessage;
  }

  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    return String(error);
  }
  if (typeof error === "symbol") {
    const symbolDescription = error.description;
    return typeof symbolDescription === "string" && symbolDescription.length > 0
      ? `Symbol(${symbolDescription})`
      : fallbackMessage;
  }

  return fallbackMessage;
};

const extractErrorStatusCode = (error: unknown): number | null =>
  extractSharedErrorStatusCode(error, { allowPartialStringStatus: true });

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
  if (value === null || value === undefined || typeof value !== "object") {
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
  if (typedHeaders === null) {
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
  if (error !== null && error !== undefined && typeof error === "object") {
    const typedError = error as {
      headers?: unknown;
      response?: {
        headers?: unknown;
      };
      cause?: {
        headers?: unknown;
        response?: {
          headers?: unknown;
        };
      };
    };

    const retryAfterFromHeaders =
      extractRetryAfterFromHeaders(typedError.response?.headers) ??
      extractRetryAfterFromHeaders(typedError.headers) ??
      extractRetryAfterFromHeaders(typedError.cause?.response?.headers) ??
      extractRetryAfterFromHeaders(typedError.cause?.headers);
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
  if (unit === "ms" || unit === "millisecond" || unit === "milliseconds") {
    multiplier = 1;
  } else if (
    unit === "m" ||
    unit === "min" ||
    unit === "minute" ||
    unit === "minutes"
  ) {
    multiplier = 60_000;
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

const isUnauthorizedPushRegistrationError = (error: unknown): boolean =>
  extractErrorStatusCode(error) === 401;

const isTransientPushRegistrationError = (error: unknown): boolean => {
  const normalizedMessage = toErrorMessage(error).toLowerCase();
  const isExplicitlyPermanent = PERMANENT_PUSH_REGISTRATION_ERROR_PATTERNS.some(
    (pattern) => normalizedMessage.includes(pattern)
  );
  if (isExplicitlyPermanent) {
    return false;
  }

  if (isRateLimitError(error)) {
    return true;
  }

  const statusCode = extractErrorStatusCode(error);
  if (statusCode !== null) {
    return statusCode === 408 || (statusCode >= 500 && statusCode < 600);
  }

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
  const [randomValue = 0] = globalThis.crypto.getRandomValues(
    new Uint32Array(1)
  );
  const jitterMultiplier =
    1 +
    ((randomValue / UINT32_RANGE) * 2 - 1) * PUSH_REGISTRATION_JITTER_FACTOR;
  return Math.max(0, Math.round(baseDelay * jitterMultiplier));
};

const extractErrorCode = (error: unknown): string | number | undefined => {
  if (error === null || typeof error !== "object") {
    return undefined;
  }

  const typedError = error as {
    code?: unknown;
    errorCode?: unknown;
  };
  const errorCode = typedError.code ?? typedError.errorCode;
  return typeof errorCode === "string" || typeof errorCode === "number"
    ? errorCode
    : undefined;
};

const isKnownLowValuePushRegistrationError = (error: unknown): boolean => {
  const normalizedMessage = toErrorMessage(error).toLowerCase();
  const normalizedErrorCode = String(extractErrorCode(error) ?? "")
    .trim()
    .toLowerCase();
  const errorRecord = toRecord(error);
  const normalizedErrorDomain =
    errorRecord === null
      ? ""
      : (getStringErrorField(errorRecord, "domain")?.toLowerCase() ?? "");

  const matchesKnownPattern = LOW_VALUE_PUSH_REGISTRATION_ERROR_PATTERNS.some(
    (pattern) => normalizedMessage.includes(pattern)
  );

  return (
    matchesKnownPattern ||
    (normalizedErrorDomain === LOW_VALUE_PUSH_REGISTRATION_ERROR_DOMAIN &&
      LOW_VALUE_PUSH_REGISTRATION_ERROR_CODE_STRINGS.has(normalizedErrorCode))
  );
};

const createErrorTelemetryExtra = (error: unknown): ErrorTelemetryExtra => {
  const statusCode = extractErrorStatusCode(error);
  const telemetryExtra: ErrorTelemetryExtra = {
    error_message: toErrorMessage(error),
  };
  if (error instanceof Error) {
    telemetryExtra.error_name = error.name;
  }
  const errorCode = extractErrorCode(error);
  if (errorCode !== undefined) {
    telemetryExtra.error_code = errorCode;
  }
  if (statusCode !== null) {
    telemetryExtra.status_code = statusCode;
  }
  return telemetryExtra;
};

const toCaptureExceptionInput = (
  error: unknown,
  fallbackMessage?: string
): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(toErrorMessage(error, fallbackMessage));
};

const isIosPushPermissionHelperApplicationError = (error: unknown): boolean =>
  toErrorMessage(error) ===
  IOS_PUSH_PERMISSION_HELPER_APPLICATION_ERROR_MESSAGE;

const requestPushNotificationPermissions = async (
  isIos: boolean
): Promise<PermissionStatus> => {
  try {
    return await PushNotifications.requestPermissions();
  } catch (error: unknown) {
    if (!isIos || !isIosPushPermissionHelperApplicationError(error)) {
      throw error;
    }

    const permissionStatus = await PushNotifications.requestPermissions();
    const errorExtra = createErrorTelemetryExtra(error);
    const retryData = {
      component: "NotificationsProvider",
      operation: "requestPermissions",
      retryable: true,
      retry_succeeded: true,
      permission_status: permissionStatus.receive,
      ...errorExtra,
    };
    console.warn(
      "iOS push permission request completed after native error retry",
      retryData
    );
    Sentry.addBreadcrumb({
      category: "notifications",
      level: "warning",
      message: "Push permission request completed after native error retry.",
      data: retryData,
    });
    return permissionStatus;
  }
};

const getUsableProfileId = (profile?: ApiIdentity): string | null => {
  const profileId = profile?.id;
  if (typeof profileId !== "string") {
    return null;
  }

  const trimmedProfileId = profileId.trim();
  return trimmedProfileId.length > 0 ? trimmedProfileId : null;
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
  profileId: getUsableProfileId(profile),
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

export const registerPushNotificationWithRetry = async (
  deviceId: string,
  deviceInfo: DeviceInfo,
  token: string,
  profileId: string
): Promise<boolean> => {
  for (let attempt = 0; attempt < PUSH_REGISTRATION_TOTAL_ATTEMPTS; attempt++) {
    const currentAuthJwt = getAuthJwt();
    if (!isAuthJwtUsable(currentAuthJwt)) {
      console.warn(
        "Skipping push registration: auth token is missing or expired",
        {
          attempt: attempt + 1,
          maxAttempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
          profileId,
          platform: deviceInfo.platform,
        }
      );
      Sentry.addBreadcrumb({
        category: "notifications",
        level: "warning",
        message: "Push registration skipped (auth token unavailable).",
        data: {
          component: "NotificationsProvider",
          operation: "registerPushNotification",
          attempt: attempt + 1,
          max_attempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
          profile_id: profileId,
          platform: deviceInfo.platform,
        },
      });
      return false;
    }

    try {
      await commonApiPost({
        endpoint: `push-notifications/register`,
        body: {
          device_id: deviceId,
          token,
          platform: deviceInfo.platform,
          profile_id: profileId,
        },
        errorMode: "structured",
      });

      return true;
    } catch (error) {
      const attemptNumber = attempt + 1;
      const statusCode = extractErrorStatusCode(error);
      const unauthorized = isUnauthorizedPushRegistrationError(error);
      const errorExtra = createErrorTelemetryExtra(error);
      const rateLimited = isRateLimitError(error);
      const retryAfterMs = extractRetryAfterMs(error);
      const hasRetriesLeft = attemptNumber < PUSH_REGISTRATION_TOTAL_ATTEMPTS;
      const shouldRetry =
        !unauthorized &&
        hasRetriesLeft &&
        isTransientPushRegistrationError(error);

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
          errorMessage: errorExtra.error_message,
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
            ...errorExtra,
            profile_id: profileId,
            platform: deviceInfo.platform,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (unauthorized) {
        console.warn(
          "Push registration unauthorized; treating as stale auth state",
          {
            attempt: attemptNumber,
            maxAttempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
            statusCode,
            profileId,
            platform: deviceInfo.platform,
          }
        );
        Sentry.addBreadcrumb({
          category: "notifications",
          level: "warning",
          message: "Push registration skipped (stale auth).",
          data: {
            component: "NotificationsProvider",
            operation: "registerPushNotification",
            attempt: attemptNumber,
            max_attempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
            status_code: statusCode ?? undefined,
            profile_id: profileId,
            platform: deviceInfo.platform,
          },
        });
        return false;
      }

      if (rateLimited) {
        console.warn("Push registration rate limited", {
          attempt: attemptNumber,
          maxAttempts: PUSH_REGISTRATION_TOTAL_ATTEMPTS,
          statusCode,
          profileId,
          errorMessage: errorExtra.error_message,
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
            ...errorExtra,
            profile_id: profileId,
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
          profile_id: profileId,
          platform: deviceInfo.platform,
          ...errorExtra,
        },
      });
      return false;
    }
  }

  return false;
};

export {
  PROFILE_SWITCH_POLL_INTERVAL_MS,
  PROFILE_SWITCH_SETTLE_TIMEOUT_MS,
  createErrorTelemetryExtra,
  createPushRegistrationFingerprint,
  extractErrorStatusCode,
  isKnownLowValuePushRegistrationError,
  isSamePushRegistrationFingerprint,
  isTransientPushRegistrationError,
  parseDevicePushData,
  registerWithRetry,
  requestPushNotificationPermissions,
  toCaptureExceptionInput,
  toRecord,
};
