import { Wave } from "../../../generated/models/Wave";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import DropsListItem from "../../drops/view/item/DropsListItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";

export default function WavesListWrapper({
  waves,
  loading,
  onBottomIntersection,
}: {
  readonly waves: Wave[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  return (
    <div className="tw-overflow-hidden">
      <div className="tw-flex tw-flex-col tw-gap-y-4">
        {waves.map((wave) => (
          <DropsListItem
            key={wave.id}
            drop={wave.description_drop}
            isWaveDescriptionDrop={true}
          />
        ))}
      </div>
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
