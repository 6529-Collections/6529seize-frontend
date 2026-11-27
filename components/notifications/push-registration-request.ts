import type { DeviceInfo } from "@capacitor/device";
import * as Sentry from "@sentry/nextjs";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";
import { isConnectedPushAuth } from "@/services/notifications/connected-push-profiles";
import type { preparePushInstallationRegistration } from "@/services/notifications/push-installation";

export const getUsablePushAuthJwt = (): string | null => {
  const jwt = getAuthJwt();
  return isAuthJwtUsable(jwt) ? jwt : null;
};

export function reportUnavailablePushAuth(
  profileId: string,
  platform: DeviceInfo["platform"],
  retryContext?: { attempt: number; maxAttempts: number }
): void {
  if (retryContext) {
    console.warn(
      "Skipping push registration: auth token is missing or expired",
      { ...retryContext, profileId, platform }
    );
  }
  Sentry.addBreadcrumb({
    category: "notifications",
    level: "warning",
    message: "Push registration skipped (auth token unavailable).",
    data: {
      component: "NotificationsProvider",
      operation: "registerPushNotification",
      ...(retryContext && {
        attempt: retryContext.attempt,
        max_attempts: retryContext.maxAttempts,
      }),
      profile_id: profileId,
      platform,
    },
  });
}

export interface PreparedPushRegistration {
  deviceId: string;
  deviceInfo: DeviceInfo;
  token: string;
  profileId: string;
  registrationJwt: string;
  installation: Awaited<ReturnType<typeof preparePushInstallationRegistration>>;
  connectedSession: boolean;
}

export function isPushRegistrationAuthCurrent(
  registration: PreparedPushRegistration
): boolean {
  return registration.connectedSession
    ? isConnectedPushAuth(registration.registrationJwt, registration.profileId)
    : getUsablePushAuthJwt() === registration.registrationJwt;
}

export function sendPreparedPushRegistration(
  registration: PreparedPushRegistration
) {
  return commonApiPost({
    endpoint: "push-notifications/register",
    headers: { Authorization: `Bearer ${registration.registrationJwt}` },
    body: {
      ...registration.installation,
      device_id: registration.deviceId,
      token: registration.token,
      platform: registration.deviceInfo.platform,
      profile_id: registration.profileId,
      include_competitions: true,
    },
    errorMode: "structured",
  });
}
