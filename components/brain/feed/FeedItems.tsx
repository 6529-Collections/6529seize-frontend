import { TypedFeedItem } from "../../../types/feed.types";
import FeedItem from "./FeedItem";
import {
  ExtendedDrop,
  getFeedItemKey,
} from "../../../helpers/waves/drop.helpers";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";
import { DropInteractionParams } from "../../waves/drops/Drop";
import { ActiveDropState } from "../../../types/dropInteractionTypes";

export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function FeedItems({
  items,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: FeedItemsProps) {
  return (
    <div className="tw-flex tw-flex-col tw-space-y-3 tw-pb-2 lg:tw-pb-4">
      {items.map((item, i) => (
        <div key={getFeedItemKey({ item, index: i })} id={`feed-item-${item.serial_no}`}>
          <CommonChangeAnimation>
            <FeedItem
              item={item}
              showWaveInfo={showWaveInfo}
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
