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
    <div className="tw-px-6 tw-mt-6 tw-space-y-4">
      {drop && <WaveDropVoters drop={drop} />}
      {drop && <WaveDropLogs drop={drop} />}
    </div>
  );
}; 
