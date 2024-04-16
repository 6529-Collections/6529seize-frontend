import { DropFull } from "../../../entities/IDrop";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import DropsList from "./DropsList";
import DropListWrapperBottomTrigger from "./DropListWrapperBottomTrigger";

export default function DropListWrapper({
  drops,
  loading,
  onBottomIntersection,
}: {
  readonly drops: DropFull[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  return (
    <div className="tw-overflow-hidden">
      <DropsList drops={drops} />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <DropListWrapperBottomTrigger
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
}
