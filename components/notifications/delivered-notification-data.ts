import type { PushNotificationSchema } from "@capacitor/push-notifications";

// Versioned Android tag mirrors the backend payload fields when native extras
// omit custom FCM data. Unknown/legacy tags must never imply a profile.
export const getNotificationData = (
  notification: PushNotificationSchema
): Record<string, unknown> | null => {
  const raw: unknown = notification.data;
  const data =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
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

export const getDeliveredNotificationProfileId = (
  notification: PushNotificationSchema
): unknown => getNotificationData(notification)?.["target_profile_id"];
