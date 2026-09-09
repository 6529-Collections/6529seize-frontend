import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import {
  isGroupedReactionsItem,
  type NotificationCause,
  type NotificationDisplayItem,
} from "@/types/feed.types";

const purchasingCauses: NotificationCause[] = [
  ApiNotificationCause.SubscriptionCoverage,
];

export function getExcludedNotificationCauses(
  hideNftPurchasing: boolean
): NotificationCause[] | null {
  return hideNftPurchasing ? purchasingCauses : null;
}

export function getVisibleNotificationCauses(
  causes: NotificationCause[] | undefined,
  hideNftPurchasing: boolean
): NotificationCause[] | null {
  if (!hideNftPurchasing) return causes && causes.length > 0 ? causes : null;
  const allowed = (causes ?? []).filter(
    (cause) => cause !== ApiNotificationCause.SubscriptionCoverage
  );
  // Leave All unfiltered and use cause_exclude for coverage. Enumerating the
  // current cause enum here would also exclude future server-added causes.
  return allowed.length > 0 ? allowed : null;
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
