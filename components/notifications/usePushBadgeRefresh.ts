import { useCallback, useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  requestPushBadgeRefresh,
  type BadgeRefreshRegistration,
} from "@/services/notifications/push-badge-refresh";

export function usePushBadgeRefresh(
  enabled: boolean,
  authKey: string
): (
  device: { deviceId: string; token: string },
  registeredAuth: string
) => void {
  const [registration, setRegistration] =
    useState<BadgeRefreshRegistration | null>(null);
  useEffect(() => {
    if (!enabled || registration?.authKey !== authKey) return;
    let current = true;
    void requestPushBadgeRefresh(registration, () => current).catch(() => {
      // Never capture request/proof contents or interrupt registration on failure.
      Sentry.captureException(new Error("Push badge refresh request failed"), {
        tags: { component: "NotificationsProvider", operation: "badgeRefresh" },
      });
    });
    return () => {
      current = false;
    };
  }, [enabled, authKey, registration]);
  return useCallback((device, registeredAuth) => {
    setRegistration({ ...device, authKey: registeredAuth });
  }, []);
}
