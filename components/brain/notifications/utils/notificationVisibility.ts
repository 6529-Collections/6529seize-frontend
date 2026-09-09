import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import {
  isGroupedReactionsItem,
  type NotificationCause,
  type NotificationDisplayItem,
} from "@/types/feed.types";

export function getVisibleNotificationCauses(
  causes: NotificationCause[] | undefined,
  hideNftPurchasing: boolean
): NotificationCause[] | null {
  if (!hideNftPurchasing) return causes && causes.length > 0 ? causes : null;
  const allowed = (causes ?? []).filter(
    (cause) => cause !== ApiNotificationCause.SubscriptionCoverage
  );
  return allowed.length
    ? allowed
    : Object.values(ApiNotificationCause).filter(
        (cause) => cause !== ApiNotificationCause.SubscriptionCoverage
      );
}

export function isNotificationVisible(
  item: NotificationDisplayItem,
  hideNftPurchasing: boolean
): boolean {
  return (
    !hideNftPurchasing ||
    isGroupedReactionsItem(item) ||
    item.cause !== ApiNotificationCause.SubscriptionCoverage
  );
}
