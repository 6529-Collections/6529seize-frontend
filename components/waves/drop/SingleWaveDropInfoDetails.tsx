import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoDetails: React.FC<
  SingleWaveDropInfoDetailsProps
> = ({ drop }) => {
  return (
    <div className="tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-overflow-hidden tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
      {drop && <SingleWaveDropVoters drop={drop} />}
      {drop && <SingleWaveDropLogs drop={drop} />}
    </div>
  );
};
