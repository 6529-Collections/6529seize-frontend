import { useEffect, useState } from "react";
import { TypedNotification } from "../../../types/feed.types";
import NotificationItem from "./NotificationItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

export interface NotificationItemsProps {
  readonly items: TypedNotification[];
  readonly onBottomIntersection: (state: boolean) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export default function NotificationItems({
  items,
  onBottomIntersection,
  activeDrop,
  onReply,
  onQuote,
  onDropClick,
}: NotificationItemsProps) {
  const getIntersectionTargetIndex = () => {
    if (items.length < 5) {
      return null;
    }
    return items.length - 5;
  };

  const [intersectionTargetIndex, setIntersectionTargetIndex] = useState<
    number | null
  >(getIntersectionTargetIndex());

  useEffect(() => {
    setIntersectionTargetIndex(getIntersectionTargetIndex());
  }, [items]);
  return (
    <div className="tw-flex tw-flex-col">
      {items.map((item, i) => (
        <div key={item.id}>
          <NotificationItem
            key={item.id}
            notification={item}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
