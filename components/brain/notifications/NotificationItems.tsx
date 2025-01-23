import { useEffect, useState } from "react";
import { TypedNotification } from "../../../types/feed.types";
import NotificationItem from "./NotificationItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";

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
    <div className="tw-flex tw-flex-col-reverse tw-space-y-3 tw-space-y-reverse">
      {items.map((item, i) => (
        <div key={item.id}>
          <CommonChangeAnimation>
            <NotificationItem
             key={item.id}
             notification={item}
             activeDrop={activeDrop}
             onReply={onReply}
             onQuote={onQuote}
             onDropClick={onDropClick}
            />
          </CommonChangeAnimation>
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
