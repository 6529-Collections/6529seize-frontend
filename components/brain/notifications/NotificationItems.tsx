import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { t } from "@/i18n/messages";
import {
  DROP_POLL_VOTED_NOTIFICATION_CAUSE,
  type NotificationDisplayItem,
  isGroupedReactionsItem,
} from "@/types/feed.types";
import { memo, useMemo, type CSSProperties } from "react";
import NotificationDropReactedGroup from "./drop-reacted/NotificationDropReactedGroup";
import NotificationItem from "./NotificationItem";

const NOTIFICATION_ITEM_RENDERING_STYLE = {
  containIntrinsicSize: "auto 400px",
  contentVisibility: "auto",
  // Keep paint containment for scroll performance while allowing the existing
  // avatar and reaction hover scale to extend beyond the row boundary.
  overflowClipMargin: "4px",
} satisfies CSSProperties;

interface NotificationItemsProps {
  readonly items: NotificationDisplayItem[];
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onMarkGroupAsRead?: ((ids: number[]) => Promise<void>) | undefined;
}

const getItemDrops = (item: NotificationDisplayItem): readonly ApiDrop[] => {
  if (isGroupedReactionsItem(item)) {
    return [item.drop];
  }

  return "related_drops" in item ? item.related_drops : [];
};

const getActiveDropForItem = (
  item: NotificationDisplayItem,
  activeDrop: ActiveDropState | null
): ActiveDropState | null => {
  if (!activeDrop) {
    return null;
  }

  return getItemDrops(item).some((drop) => drop.id === activeDrop.drop.id)
    ? activeDrop
    : null;
};

const getNonGroupedKeySuffix = (
  itemId: unknown,
  index: number
): string | number => {
  if (typeof itemId === "string" || typeof itemId === "number") {
    return itemId;
  }

  return `fallback-${index}`;
};

function NotificationItemsComponent({
  items,
  activeDrop,
  onReply,
  onDropContentClick,
  onMarkGroupAsRead,
}: NotificationItemsProps) {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();
  const { findCustomEmoji, findNativeEmoji } = useEmoji();
  const keyedItems = useMemo(
    () =>
      items.map((item, index) => {
        const keySuffix = isGroupedReactionsItem(item)
          ? `group-${item.drop.id}`
          : getNonGroupedKeySuffix(item.id, index);
        return {
          item,
          key: `notification-${keySuffix}`,
          domId: `feed-item-${keySuffix}`,
        };
      }),
    [items]
  );

  const hasNotificationContent = (item: NotificationDisplayItem): boolean => {
    if (isGroupedReactionsItem(item)) {
      return true;
    }

    // Match the child renderers before adding a row label or divider.
    switch (item.cause) {
      case ApiNotificationCause.DropReacted: {
        if (!Array.isArray(item.related_drops) || !item.related_drops[0]) {
          return false;
        }
        const rawId = item.additional_context.reaction.replaceAll(":", "");
        return !!findCustomEmoji(rawId) || !!findNativeEmoji(rawId);
      }
      case ApiNotificationCause.DropReplied:
        return Array.isArray(item.related_drops) && !!item.related_drops[1];
      case ApiNotificationCause.DropQuoted:
      case ApiNotificationCause.IdentityMentioned:
      case ApiNotificationCause.DropVoted:
      case DROP_POLL_VOTED_NOTIFICATION_CAUSE:
      case ApiNotificationCause.DropBoosted:
      case ApiNotificationCause.AllDrops:
        return Array.isArray(item.related_drops) && !!item.related_drops[0];
      case ApiNotificationCause.IdentitySubscribed:
      case ApiNotificationCause.IdentityRep:
      case ApiNotificationCause.IdentityNic:
      case ApiNotificationCause.WaveCreated:
      case ApiNotificationCause.PriorityAlert:
      case ApiNotificationCause.SubscriptionCoverage:
      default:
        return true;
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-pb-3">
      {keyedItems.map(({ item, key, domId }) => {
        if (!hasNotificationContent(item)) {
          return null;
        }
        const itemActiveDrop = getActiveDropForItem(item, activeDrop);
        const isUnread = isGroupedReactionsItem(item)
          ? item.notifications.some(
              (notification) => notification.read_at === null
            )
          : item.read_at === null;

        return (
          <div
            key={key}
            id={domId}
            style={NOTIFICATION_ITEM_RENDERING_STYLE}
            className={`tw-min-w-0 tw-border-0 tw-border-b tw-border-solid tw-py-3 first:tw-pt-1 last:tw-border-b-0 ${
              isApp ? "tw-border-iron-700" : "tw-border-iron-800"
            }`}
          >
            {isUnread && (
              <div className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-semibold tw-text-iron-200">
                <span
                  aria-hidden="true"
                  className="tw-size-1.5 tw-rounded-full tw-bg-primary-400"
                />
                {t(locale, "notifications.status.unread")}
              </div>
            )}
            {isGroupedReactionsItem(item) ? (
              <div className="tw-flex">
                <div className="tw-relative lg:tw-hidden">
                  <div className="tw-h-full tw-w-[1px] -tw-translate-x-8 tw-bg-iron-800" />
                </div>
                <div className="tw-w-full tw-min-w-0">
                  <NotificationDropReactedGroup
                    group={item}
                    activeDrop={itemActiveDrop}
                    onReply={onReply}
                    onDropContentClick={onDropContentClick}
                    onMarkAsRead={onMarkGroupAsRead}
                  />
                </div>
              </div>
            ) : (
              <NotificationItem
                notification={item}
                activeDrop={itemActiveDrop}
                onReply={onReply}
                onDropContentClick={onDropContentClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const NotificationItems = memo(
  NotificationItemsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.items === nextProps.items &&
      prevProps.activeDrop === nextProps.activeDrop &&
      prevProps.onReply === nextProps.onReply &&
      prevProps.onDropContentClick === nextProps.onDropContentClick &&
      prevProps.onMarkGroupAsRead === nextProps.onMarkGroupAsRead
    );
  }
);

NotificationItems.displayName = "NotificationItems";

export default NotificationItems;
