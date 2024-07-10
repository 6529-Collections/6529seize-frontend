import { Drop } from "../../../generated/models/Drop";

import DropsListItem from "./item/DropsListItem";

export default function DropsList({
  drops,
  showWaveInfo,
  showIsWaveDescriptionDrop = false,
}: {
  readonly drops: Drop[];
  readonly showWaveInfo: boolean;
  readonly showIsWaveDescriptionDrop?: boolean;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-4">
      {drops.map((drop) => (
        <DropsListItem
          drop={drop}
          key={drop.id}
          showWaveInfo={showWaveInfo}
          isWaveDescriptionDrop={
            showIsWaveDescriptionDrop &&
            drop.id === drop.wave.description_drop_id
          }
        />
      ))}
    </div>
  );
}
