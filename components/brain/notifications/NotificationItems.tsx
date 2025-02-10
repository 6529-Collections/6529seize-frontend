import { TypedNotification } from "../../../types/feed.types";
import NotificationItem from "./NotificationItem";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams } from "../../waves/drops/Drop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";

export interface NotificationItemsProps {
  readonly items: TypedNotification[];
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function NotificationItems({
  items,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: NotificationItemsProps) {
  return (
    <div className="tw-flex tw-flex-col tw-space-y-3 tw-pb-3">
      {items.map((notification, i) => (
        <div key={`notification-${notification.id}-${i}`} id={`feed-item-${notification.id}`}>
          <CommonChangeAnimation>
            <NotificationItem
              notification={notification}
              activeDrop={activeDrop}
              onReply={onReply}
              onQuote={onQuote}
              onDropContentClick={onDropContentClick}
            />
          </CommonChangeAnimation>
        </div>
      ))}
    </div>
  );
}
