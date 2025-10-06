import { useMemo, type RefObject } from "react";
import { TypedNotification } from "@/types/feed.types";
import NotificationItem from "./NotificationItem";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import CommonChangeAnimation from "@/components/utils/animation/CommonChangeAnimation";
import NotificationVirtualWrapper from "./NotificationVirtualWrapper";

interface NotificationItemsProps {
  readonly items: TypedNotification[];
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export default function NotificationItems({
  items,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
  scrollContainerRef,
}: NotificationItemsProps) {
  const keyedNotifications = useMemo(
    () =>
      items.map((notification, index) => ({
        notification,
        key: `notification-${notification.id}-${index}`,
      })),
    [items]
  );

  return (
    <div className="tw-flex tw-flex-col tw-space-y-3 tw-pb-3 lg:tw-pr-2">
      {keyedNotifications.map(({ notification, key }) => (
        <div key={key} id={`feed-item-${notification.id}`}>
          <NotificationVirtualWrapper scrollContainerRef={scrollContainerRef}>
            <CommonChangeAnimation>
              <NotificationItem
                notification={notification}
                activeDrop={activeDrop}
                onReply={onReply}
                onQuote={onQuote}
                onDropContentClick={onDropContentClick}
              />
            </CommonChangeAnimation>
          </NotificationVirtualWrapper>
        </div>
      ))}
    </div>
  );
}
