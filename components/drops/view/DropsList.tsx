import { Drop } from "../../../generated/models/Drop";
import DropsListItem from "./item/DropsListItem";

export default function DropsList({
  drops,
  showWaveInfo,
}: {
  readonly drops: Drop[];
  readonly showWaveInfo: boolean;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      {drops.map((drop) => (
        <DropsListItem drop={drop} key={drop.id} showWaveInfo={showWaveInfo} />
      ))}
    </div>
  );
}
