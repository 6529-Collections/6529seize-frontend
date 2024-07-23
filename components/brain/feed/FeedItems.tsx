import { TypedFeedItem } from "../../../types/feed.types";
import RateClapOutlineIcon from "../../utils/icons/RateClapOutlineIcon";
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
    <div className="tw-flex tw-gap-x-3">
      <div className="tw-flex tw-flex-col tw-gap-y-5 tw-max-w-[672px]">
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
