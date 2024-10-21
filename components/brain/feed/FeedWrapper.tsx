import { TypedFeedItem } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { DropInteractionParams } from "../../waves/detailed/drops/WaveDetailedDrop";
import FeedItems from "./FeedItems";

interface FeedWrapperProps {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
}

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  onBottomIntersection,
  onReply,
  onQuote,
}: FeedWrapperProps) {
  return (
    <div className="tw-relative">
      <FeedItems
        items={items}
        showWaveInfo={showWaveInfo}
        onBottomIntersection={onBottomIntersection}
        onReply={onReply}
        onQuote={onQuote}
      />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
    </div>
  );
}
