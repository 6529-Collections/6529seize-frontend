import { Wave } from "../../../generated/models/Wave";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import WaveItem from "./WaveItem";

export default function WavesListWrapper({
  label,
  waves,
}: {
  readonly label: string;
  readonly waves: Wave[];
}) {
  return (
    <div>
      <span className="tw-tracking-tight tw-text-2xl tw-font-medium">
        {label}
      </span>
      <div className="tw-overflow-hidden">
        <div className="tw-mt-2 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
          {waves.map((wave) => (
            <WaveItem key={wave.id} wave={wave} />
          ))}
        </div>
      </div>
    </div>
  );
}
