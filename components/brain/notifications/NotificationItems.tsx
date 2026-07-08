import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  type NotificationDisplayItem,
  isGroupedReactionsItem,
} from "@/types/feed.types";
import { memo, useMemo } from "react";
import NotificationDropReactedGroup from "./drop-reacted/NotificationDropReactedGroup";
import NotificationItem from "./NotificationItem";

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

  return (
    <div className="tw-flex tw-flex-col tw-space-y-3 tw-pb-3">
      {keyedItems.map(({ item, key, domId }) => {
        const itemActiveDrop = getActiveDropForItem(item, activeDrop);

        return (
          <div key={key} id={domId}>
            {isGroupedReactionsItem(item) ? (
              <div className="tw-flex">
                <div className="tw-relative lg:tw-hidden">
                  <div className="tw-h-full tw-w-[1px] -tw-translate-x-8 tw-bg-iron-800" />
                </div>
                <div className="tw-w-full">
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
