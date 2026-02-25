import { memo, useMemo } from "react";

import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  isGroupedReactionsItem,
  type NotificationDisplayItem,
} from "@/types/feed.types";

import NotificationDropReactedGroup from "./drop-reacted/NotificationDropReactedGroup";
import NotificationItem from "./NotificationItem";

interface NotificationItemsProps {
  readonly items: NotificationDisplayItem[];
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onMarkGroupAsRead?: ((ids: number[]) => Promise<void>) | undefined;
}

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
          : (item.id ?? `fallback-${index}`);
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
      {keyedItems.map(({ item, key, domId }) => (
        <div key={key} id={domId}>
          {isGroupedReactionsItem(item) ? (
            <div className="tw-flex">
              <div className="tw-relative lg:tw-hidden">
                <div className="tw-h-full tw-w-[1px] -tw-translate-x-8 tw-bg-iron-800" />
              </div>
              <div className="tw-w-full">
                <NotificationDropReactedGroup
                  group={item}
                  activeDrop={activeDrop}
                  onReply={onReply}
                  onDropContentClick={onDropContentClick}
                  onMarkAsRead={
                    onMarkGroupAsRead
                      ? (ids) => onMarkGroupAsRead(ids)
                      : undefined
                  }
                />
              </div>
            </div>
          ) : (
            <NotificationItem
              notification={item}
              activeDrop={activeDrop}
              onReply={onReply}
              onDropContentClick={onDropContentClick}
            />
          )}
        </div>
      ))}
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
