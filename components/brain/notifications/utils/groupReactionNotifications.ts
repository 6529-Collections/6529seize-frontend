import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type {
  GroupedReactionsItem,
  INotificationDropReacted,
  NotificationDisplayItem,
  TypedNotification,
} from "@/types/feed.types";

function getDropId(n: INotificationDropReacted): string {
  const drop = n.related_drops[0];
  return drop?.id ?? `no-drop-${n.id}`;
}

function isDropReacted(
  item: TypedNotification
): item is INotificationDropReacted {
  return item.cause === ApiNotificationCause.DropReacted;
}

export function groupReactionNotifications(
  items: TypedNotification[]
): NotificationDisplayItem[] {
  const byDropId = new Map<
    string,
    {
      anchorIndex: number;
      anchorCreatedAt: number;
      notifications: INotificationDropReacted[];
    }
  >();

  items.forEach((item, index) => {
    if (!isDropReacted(item)) return;
    const drop = item.related_drops[0];
    if (!drop) return;
    const key = drop.id;
    const existing = byDropId.get(key);
    if (!existing) {
      byDropId.set(key, {
        anchorIndex: index,
        anchorCreatedAt: item.created_at,
        notifications: [item],
      });
      return;
    }
    existing.notifications.push(item);
    if (item.created_at >= existing.anchorCreatedAt) {
      existing.anchorIndex = index;
      existing.anchorCreatedAt = item.created_at;
    }
  });

  const indexToGroup = new Map<number, GroupedReactionsItem>();
  byDropId.forEach(({ anchorIndex, notifications }) => {
    if (notifications.length < 2) return;
    const latest = notifications.reduce(
      (a, b) => (a.created_at >= b.created_at ? a : b),
      notifications[0]!
    );
    const drop = latest.related_drops[0]!;
    indexToGroup.set(anchorIndex, {
      type: "grouped_reactions",
      notifications,
      drop,
      createdAt: latest.created_at,
      id: latest.id,
    });
  });

  const result: NotificationDisplayItem[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!;
    if (indexToGroup.has(i)) {
      result.push(indexToGroup.get(i)!);
      continue;
    }
    if (isDropReacted(item)) {
      const key = getDropId(item);
      const group = byDropId.get(key);
      if (group && group.notifications.length >= 2 && group.anchorIndex !== i) {
        continue;
      }
    }
    result.push(item);
  }
  return result;
}
