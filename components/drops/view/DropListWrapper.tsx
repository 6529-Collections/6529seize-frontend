import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import DropsList from "./DropsList";
import { Drop } from "../../../generated/models/Drop";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";

export default function DropListWrapper({
  drops,
  loading,
  showWaveName,
  onBottomIntersection,
}: {
  readonly drops: Drop[];
  readonly loading: boolean;
  readonly showWaveName: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  return (
    <div className="tw-overflow-hidden">
      <DropsList drops={drops} showWaveName={showWaveName} />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
