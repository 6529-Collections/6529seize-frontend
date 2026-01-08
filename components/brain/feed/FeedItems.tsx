import type { TypedFeedItem } from "@/types/feed.types";
import FeedItem from "./FeedItem";
import type { ExtendedDrop} from "@/helpers/waves/drop.helpers";
import { getFeedItemKey } from "@/helpers/waves/drop.helpers";
import CommonChangeAnimation from "@/components/utils/animation/CommonChangeAnimation";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ActiveDropState } from "@/types/dropInteractionTypes";

interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
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
        <div
          key={getFeedItemKey({ item, index: i })}
          id={`feed-item-${item.serial_no}`}
        >
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
