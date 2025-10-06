import { memo, useMemo } from "react";
import { TypedNotification } from "@/types/feed.types";
import NotificationItem from "./NotificationItem";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface NotificationItemsProps {
  readonly items: TypedNotification[];
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

function NotificationItemsComponent({
  items,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: NotificationItemsProps) {
  const keyedNotifications = useMemo(
    () =>
      items.map((notification, index) => {
        const keySuffix = notification.id ?? `fallback-${index}`;

        return {
          notification,
          key: `notification-${keySuffix}`,
          domId: `feed-item-${keySuffix}`,
        };
      }),
    [items]
  );

  return (
    <div className="tw-flex tw-flex-col tw-space-y-3 tw-pb-3 lg:tw-pr-2">
      {keyedNotifications.map(({ notification, key, domId }) => (
        <div key={key} id={domId}>
          <NotificationItem
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropContentClick={onDropContentClick}
          />
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
      prevProps.onQuote === nextProps.onQuote &&
      prevProps.onDropContentClick === nextProps.onDropContentClick
    );
  }
);

NotificationItems.displayName = "NotificationItems";

export default NotificationItems;
