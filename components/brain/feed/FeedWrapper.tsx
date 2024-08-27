import { TypedFeedItem } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import FeedItems from "./FeedItems";

interface FeedWrapperProps {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  availableCredit,
  onBottomIntersection,
}: FeedWrapperProps) {
  return (
    <div className="tw-relative">
      <FeedItems
        items={items}
        showWaveInfo={showWaveInfo}
        availableCredit={availableCredit}
        onBottomIntersection={onBottomIntersection}
      />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
    </div>
  );
}
