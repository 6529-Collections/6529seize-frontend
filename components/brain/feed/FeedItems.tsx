import { useEffect, useState } from "react";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItem from "./FeedItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getFeedItemKey } from "../../../helpers/waves/drop.helpers";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";

export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function FeedItems({
  items,
  showWaveInfo,
  onBottomIntersection,
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
    <div className="tw-flex tw-flex-col lg:tw-w-[672px]">
      {items.map((item, i) => (
        <div key={getFeedItemKey({ item, index: i })}>
          <CommonChangeAnimation>
            <FeedItem
              item={item}
              showWaveInfo={showWaveInfo}
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
