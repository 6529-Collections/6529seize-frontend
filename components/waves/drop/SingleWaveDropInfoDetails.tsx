import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { isMemesWave } from "../../../helpers/waves/waves.helpers";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";
import { SingleWaveDropTraits } from "./SingleWaveDropTraits";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoDetails: React.FC<
  SingleWaveDropInfoDetailsProps
> = ({ drop }) => {
  // Check if this is the memes wave
  const isMemes = drop ? isMemesWave(drop.wave.id) : false;

  return (
    <div className="tw-px-6 tw-space-y-4 tw-pb-6 tw-pt-2">
      {drop && <SingleWaveDropVoters drop={drop} />}
      {drop && <SingleWaveDropLogs drop={drop} />}
    </div>
  );
};
