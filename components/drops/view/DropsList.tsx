import { Drop } from "../../../generated/models/Drop";
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
    <div className="tw-flex tw-flex-col tw-gap-y-2.5">
      {drops.map((drop) => (
        <DropsListItem
          drop={drop}
          key={drop.id}
          availableCredit={availableCredit}
          replyToDrop={null}
          showWaveInfo={showWaveInfo}
        />
      ))}
    </div>
  );
}
