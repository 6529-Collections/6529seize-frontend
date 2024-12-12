import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveDropVoters } from "./WaveDropVoters";
import { WaveDropLogs } from "./WaveDropLogs";

interface WaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
}

export const WaveDropInfoDetails: React.FC<WaveDropInfoDetailsProps> = ({
  drop,
}) => {
  return (
    <div className="tw-px-6 tw-mt-4 tw-space-y-4 tw-pb-6">
      {drop && <WaveDropVoters drop={drop} />}
      {drop && <WaveDropLogs drop={drop} />}
    </div>
  );
}; 
