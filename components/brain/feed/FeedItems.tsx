import { useEffect, useState } from "react";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItem from "./FeedItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { ExtendedDrop, getFeedItemKey } from "../../../helpers/waves/drop.helpers";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";

export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export default function FeedItems({
  items,
  showWaveInfo,
  activeDrop,
  onBottomIntersection,
  onReply,
  onQuote,
  onDropClick,
}: FeedItemsProps) {
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
    <div className="tw-flex tw-flex-col tw-space-y-3">
      {items.map((item, i) => (
        <div key={getFeedItemKey({ item, index: i })}>
          <CommonChangeAnimation>
            <FeedItem
              item={item}
              showWaveInfo={showWaveInfo}
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
