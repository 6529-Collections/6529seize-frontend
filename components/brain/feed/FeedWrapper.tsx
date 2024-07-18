import { FeedItem } from "../../../generated/models/FeedItem";
import { TypedFeedItem } from "../../../types/feed.types";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  availableCredit,
  onBottomIntersection,
}: {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  console.log(items);
  return (
    <div className="tw-overflow-hidden">
      <div>feedlist</div>
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
