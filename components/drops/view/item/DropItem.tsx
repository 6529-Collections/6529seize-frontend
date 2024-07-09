import { Drop } from "../../../../generated/models/Drop";
import { getRandomColorWithSeed } from "../../../../helpers/Helpers";
import DropItemPart from "./part/DropItemPart";
import DropItemBanner from "./utils/DropItemBanner";

export default function DropItem({
  drop,
  showAsWaveDrop,
  showWaveInfo,
}: {
  readonly drop: Drop;
  readonly showWaveInfo: boolean;
  readonly showAsWaveDrop: boolean;
}) {
  return (
    <div className="tw-relative tw-bg-iron-900 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800">
      {showAsWaveDrop && <DropItemBanner drop={drop} />}
      <div>
        {drop.parts.map((part, index) => (
          <DropItemPart
            key={`drop-${drop.id}-part-${part.part_id}`}
            drop={drop}
            isLast={index === drop.parts.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
