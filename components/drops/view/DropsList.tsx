import { Drop } from "../../../generated/models/Drop";
import DropItem from "./item/DropItem";
import DropsListItem from "./item/DropsListItem";

export default function DropsList({
  drops,
  showWaveInfo,
  availableCredit,
}: {
  readonly drops: Drop[];
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      {drops.map((drop) => (
        <DropItem drop={drop} key={drop.id} />
      ))}
    </div>
  );
}
