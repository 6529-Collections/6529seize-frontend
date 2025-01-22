import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TypedFeedItem } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import FeedItems from "./FeedItems";

interface FeedWrapperProps {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  activeDrop,
  onBottomIntersection,
  onReply,
  onQuote,
  onDropContentClick,
}: FeedWrapperProps) {
  return (
    <div className="tw-relative tw-h-full">
      <div className="tw-w-full tw-h-full tw-flex tw-flex-col">
        <div className="lg:tw-pb-2 tw-flex tw-flex-col-reverse tw-flex-grow">
          <div className="tw-flex tw-flex-col-reverse tw-flex-grow">
            <div className="tw-overflow-hidden">
              {loading && (
                <div className="tw-w-full tw-text-center tw-mt-4 tw-pb-4">
                  <CircleLoader size={CircleLoaderSize.XXLARGE} />
                </div>
              )}
              <FeedItems
                items={items}
                showWaveInfo={showWaveInfo}
                activeDrop={activeDrop}
                onBottomIntersection={onBottomIntersection}
                onReply={onReply}
                onQuote={onQuote}
                onDropContentClick={onDropContentClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
