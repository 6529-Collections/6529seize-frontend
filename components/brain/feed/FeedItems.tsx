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
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      {items.map((item, i) => (
        <FeedItem
          key={`feed-item-${item.type}-${i}`}
          item={item}
          showWaveInfo={showWaveInfo}
          availableCredit={availableCredit}
        />
      ))}
    </div>
  );
}