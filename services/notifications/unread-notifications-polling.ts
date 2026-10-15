import { isTerminalNotificationAuthQueryError } from "@/components/react-query-wrapper/utils/query-utils";

/**
 * Unread counts are driven by the notification WebSocket: new notifications
 * and reads send IDENTITY_NOTIFICATIONS_CHANGED, and every (re)connect
 * refreshes once its identity sync is acknowledged. Polling is only the
 * safety net, shared by the active and the other connected accounts.
 */
const UNREAD_NOTIFICATIONS_RECONCILIATION_INTERVAL_MS = 5 * 60_000;
/** Used while the socket is down or has not yet confirmed this profile. */
const UNREAD_NOTIFICATIONS_FALLBACK_INTERVAL_MS = 30_000;

interface NotificationSocketCoverage {
  readonly connected: boolean;
  readonly syncedProfileIds: readonly string[];
}

export const isProfileCoveredByNotificationSocket = (
  coverage: NotificationSocketCoverage,
  profileId: string | null | undefined
): boolean =>
  coverage.connected &&
  !!profileId &&
  coverage.syncedProfileIds.includes(profileId);

export const getUnreadNotificationsRefetchInterval = (
  query: { readonly state: { readonly error: unknown } },
  isRealtimeCovered: boolean
): number | false => {
  if (isTerminalNotificationAuthQueryError(query.state.error)) {
    return false;
  }
  return isRealtimeCovered
    ? UNREAD_NOTIFICATIONS_RECONCILIATION_INTERVAL_MS
    : UNREAD_NOTIFICATIONS_FALLBACK_INTERVAL_MS;
};
