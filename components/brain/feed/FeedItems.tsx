import { useEffect, useState } from "react";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItem from "./FeedItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getDropKey } from "../../../helpers/waves/drop.helpers";
import { FeedItemType } from "../../../generated/models/FeedItemType";

export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function FeedItems({
  items,
  showWaveInfo,
  availableCredit,
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
        <div
          key={
            i === 0 && item.type === FeedItemType.DropCreated
              ? getDropKey({ drop: item.item, index: 0 })
              : `feed-item-${item.serial_no}`
          }
        >
          <FeedItem
            item={item}
            showWaveInfo={showWaveInfo}
            availableCredit={availableCredit}
          />
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
