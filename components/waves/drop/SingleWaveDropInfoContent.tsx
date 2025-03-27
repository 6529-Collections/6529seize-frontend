import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiDropType } from "../../../generated/models/ObjectSerializer";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { SingleWaveDropContent } from "./SingleWaveDropContent";
import { MemesSingleWaveDropContent } from "./MemesSingleWaveDropContent";
import { WinnerBadge } from "./WinnerBadge";
import { useSeizeSettings } from "../../../contexts/SeizeSettingsContext";

interface SingleWaveDropInfoContentProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoContent: React.FC<
  SingleWaveDropInfoContentProps
> = ({ drop }) => {
  if (!drop) {
    return null;
  }
  // Check if this is a memes wave drop
  const { isMemesWave } = useSeizeSettings();
  const isMemes = isMemesWave(drop.wave.id);

  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-4">
      <div className="tw-px-6">
        {drop?.drop_type === ApiDropType.Participatory && (
          <SingleWaveDropPosition rank={drop.rank} />
        )}
        {drop.drop_type === ApiDropType.Winner && (
          <WinnerBadge drop={drop} showBadge={true} />
        )}
      </div>

      <div className="tw-flex-1 tw-w-full">
        <div className="tw-px-6">
          {drop && isMemes ? (
            <MemesSingleWaveDropContent drop={drop} />
          ) : (
            drop && <SingleWaveDropContent drop={drop} />
          )}
        </div>
      </div>
    </div>
  );
};
