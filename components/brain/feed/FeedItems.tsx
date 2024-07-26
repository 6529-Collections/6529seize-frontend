import { TypedFeedItem } from "../../../types/feed.types";
import FeedItem from "./FeedItem";

export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}

export default function FeedItems({
  items,
  showWaveInfo,
  availableCredit,
}: FeedItemsProps) {
  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-flex tw-flex-col tw-w-[672px]">
        {items.map((item, i) => (
          <FeedItem
            key={`feed-item-${item.type}-${i}`}
            item={item}
            showWaveInfo={showWaveInfo}
            availableCredit={availableCredit}
          />
        ))}
      </div>
    </div>
  );
}
