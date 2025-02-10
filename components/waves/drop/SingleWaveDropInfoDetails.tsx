import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoDetails: React.FC<SingleWaveDropInfoDetailsProps> = ({
  drop,
}) => {
  return (
    <div className="tw-px-6 tw-mt-4 tw-space-y-4 tw-pb-6">
      {drop && <SingleWaveDropVoters drop={drop} />}
      {drop && <SingleWaveDropLogs drop={drop} />}
    </div>
  );
}; 