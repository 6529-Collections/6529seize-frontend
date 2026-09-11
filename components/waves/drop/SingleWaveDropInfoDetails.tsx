import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropVoteDistribution from "./DropVoteDistribution";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropTechnicalDetails } from "./SingleWaveDropTechnicalDetails";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";
import type { DropVoteSummaryState } from "./useDropVoteSummary";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
  readonly voteSummary: DropVoteSummaryState;
}

export const SingleWaveDropInfoDetails: React.FC<
  SingleWaveDropInfoDetailsProps
> = ({ drop, voteSummary }) => {
  return (
    <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/10 tw-overflow-hidden tw-rounded-lg tw-ring-1 tw-ring-white/10">
      {drop && (
        <SingleWaveDropVoters
          drop={drop}
          summary={
            <DropVoteDistribution drop={drop} voteSummary={voteSummary} />
          }
        />
      )}
      {drop && <SingleWaveDropLogs drop={drop} />}
      {drop && <SingleWaveDropTechnicalDetails drop={drop} />}
    </div>
  );
};
