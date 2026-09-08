import React from "react";
import type { ApiDropVoteDistribution } from "@/generated/models/ApiDropVoteDistribution";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropVoteDistribution from "./DropVoteDistribution";
import { SingleWaveDropLogs } from "./SingleWaveDropLogs";
import { SingleWaveDropTechnicalDetails } from "./SingleWaveDropTechnicalDetails";
import { SingleWaveDropVoters } from "./SingleWaveDropVoters";

interface SingleWaveDropInfoDetailsProps {
  readonly drop: ExtendedDrop | undefined;
  readonly voteDistribution?: ApiDropVoteDistribution | undefined;
}

export const SingleWaveDropInfoDetails: React.FC<
  SingleWaveDropInfoDetailsProps
> = ({ drop, voteDistribution }) => {
  return (
    <div className="tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-overflow-hidden tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
      {drop && (
        <SingleWaveDropVoters
          drop={drop}
          summary={
            <DropVoteDistribution
              drop={drop}
              voteDistribution={voteDistribution}
            />
          }
        />
      )}
      {drop && <SingleWaveDropLogs drop={drop} />}
      {drop && <SingleWaveDropTechnicalDetails drop={drop} />}
    </div>
  );
};
