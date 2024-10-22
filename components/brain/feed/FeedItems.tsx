import { useEffect, useState } from "react";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItem from "./FeedItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getFeedItemKey } from "../../../helpers/waves/drop.helpers";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";
import { DropInteractionParams } from "../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";
export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
}

export default function FeedItems({
  items,
  showWaveInfo,
  activeDrop,
  onBottomIntersection,
  onReply,
  onQuote,
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
    <div className="tw-flex tw-flex-col">
      {items.map((item, i) => (
        <div key={getFeedItemKey({ item, index: i })}>
          <CommonChangeAnimation>
            <FeedItem
              item={item}
              showWaveInfo={showWaveInfo}
              activeDrop={activeDrop}
              onReply={onReply}
              onQuote={onQuote}
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
