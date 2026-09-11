import {
  PushNotifications,
  type PushNotificationSchema,
} from "@capacitor/push-notifications";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { commonApiFetch } from "@/services/api/common-api";
import { toRecord } from "./notificationsPushRegistration";

interface CleanupScope {
  readonly profileId: string;
  readonly authJwt: string;
  readonly waveId?: string;
  readonly isCurrent: () => boolean;
}

// Versioned Android tag mirrors the backend payload fields when native extras
// omit custom FCM data. Unknown/legacy tags must never imply a profile.
const getNotificationData = (
  notification: PushNotificationSchema
): Record<string, unknown> | null => {
  const data = toRecord(notification.data);
  if (typeof data?.["target_profile_id"] === "string") return data;
  const tag: unknown = notification.tag;
  if (typeof tag !== "string") return null;
  const parts = tag.split(":");
  if (parts.length !== 5 || parts[0] !== "6529" || parts[1] !== "v1")
    return null;
  try {
    return {
      target_profile_id: decodeURIComponent(parts[2] ?? ""),
      notification_id: parts[3],
      wave_id: decodeURIComponent(parts[4] ?? ""),
    };
  } catch {
    return null;
  }
};

const getNotificationId = (
  notification: PushNotificationSchema
): number | null => {
  const raw = getNotificationData(notification)?.["notification_id"];
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  // The exclusive id_less_than cursor below must also remain a safe integer.
  return Number.isSafeInteger(id) && Number.isSafeInteger(id + 1) ? id : null;
};

/**
 * Reconcile only a captured profile's delivered snapshot. Missing records are
 * not proof of a read (filters can hide them). Never derive an app badge from
 * tray size or call native global cleanup: iOS badges belong to the push worker.
 */
export async function reconcileDeliveredNotifications(
  scope: CleanupScope
): Promise<void> {
  if (!scope.isCurrent()) return;
  const { notifications } = await PushNotifications.getDeliveredNotifications();
  const candidates = notifications.filter((notification) => {
    const data = getNotificationData(notification);
    return (
      data?.["target_profile_id"] === scope.profileId &&
      (scope.waveId === undefined || data["wave_id"] === scope.waveId) &&
      getNotificationId(notification) !== null
    );
  });
  const ids = [...new Set(candidates.map(getNotificationId))];
  const readIds = new Set<number>();

  // Bound concurrent requests, and complete every lookup before mutating the
  // tray. Any refresh failure preserves the complete delivered snapshot.
  for (let offset = 0; offset < ids.length; offset += 4) {
    if (!scope.isCurrent()) return;
    const results = await Promise.allSettled(
      ids.slice(offset, offset + 4).map(async (id) => {
        if (id === null) return;
        const response = await commonApiFetch<ApiNotificationsResponseV2>({
          endpoint: "v2/notifications",
          params: { limit: "1", id_less_than: String(id + 1) },
          headers: { Authorization: `Bearer ${scope.authJwt}` },
          cache: "no-store",
          errorMode: "structured",
        });
        const record = response.notifications.find((item) => item.id === id);
        if (
          record &&
          typeof record.read_at === "number" &&
          Number.isFinite(record.read_at)
        ) {
          readIds.add(id);
        }
      })
    );
    // Drain the whole batch before releasing the queue after a failed lookup.
    const failed = results.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
  }

  if (!scope.isCurrent()) return;
  const readNotifications = candidates.filter((notification) => {
    const id = getNotificationId(notification);
    return id !== null && readIds.has(id);
  });
  if (readNotifications.length > 0) {
    // Keep the original native id AND Android tag, not the backend notification id.
    await PushNotifications.removeDeliveredNotifications({
      notifications: readNotifications,
    });
  }
}

/** Serialize native passes and retain a fresh pass for reads made in flight. */
export function createDeliveredNotificationsReconciler(
  onError: (error: unknown) => void
): (scope: CleanupScope) => Promise<void> {
  let pending: CleanupScope | undefined;
  let running: Promise<void> | undefined;

  const drain = async () => {
    try {
      while (pending) {
        const scope = pending;
        pending = undefined;
        try {
          await reconcileDeliveredNotifications(scope);
        } catch (error) {
          onError(error);
        }
      }
    } finally {
      running = undefined;
    }
  };

  return (scope) => {
    if (!scope.isCurrent()) return Promise.resolve();
    // Only the current session can enqueue. Coalesce different wave requests
    // into a profile pass so neither wave's completed read is lost.
    const waveId =
      pending?.profileId === scope.profileId &&
      pending.authJwt === scope.authJwt &&
      pending.waveId !== scope.waveId
        ? undefined
        : scope.waveId;
    pending = {
      profileId: scope.profileId,
      authJwt: scope.authJwt,
      isCurrent: scope.isCurrent,
      ...(waveId === undefined ? {} : { waveId }),
    };
    running ??= drain();
    return running;
  };
}
