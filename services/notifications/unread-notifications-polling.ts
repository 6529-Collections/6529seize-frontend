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

/**
 * While the socket covers a profile, its count changes only through socket
 * invalidations, so a window focus or another badge mounting need not refetch
 * it. Without coverage the app's default stale time applies, as before.
 */
export const getUnreadNotificationsStaleTimeOption = (
  isRealtimeCovered: boolean
): { readonly staleTime?: number } =>
  isRealtimeCovered
    ? { staleTime: UNREAD_NOTIFICATIONS_RECONCILIATION_INTERVAL_MS }
    : {};

/**
 * A hidden tab polls only while the socket does not cover the profile; a
 * covered tab still gets the socket's invalidations in the background.
 */
export const shouldPollUnreadNotificationsInBackground = ({
  isMobileEnvironment,
  isRealtimeCovered,
}: {
  readonly isMobileEnvironment: boolean;
  readonly isRealtimeCovered: boolean;
}): boolean => !isMobileEnvironment && !isRealtimeCovered;

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
