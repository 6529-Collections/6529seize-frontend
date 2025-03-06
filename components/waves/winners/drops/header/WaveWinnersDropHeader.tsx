import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";
import WaveWinnersDropHeaderAuthorPfp from "./WaveWinnersDropHeaderAuthorPfp";
import WaveWinnersDropHeaderRank from "./WaveWinnersDropHeaderRank";
import WaveWinnersDropHeaderAuthorHandle from "./WaveWinnersDropHeaderAuthorHandle";
import WaveWinnersDropHeaderCreated from "./WaveWinnersDropHeaderCreated";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropHeaderProps {
  readonly winner: ApiWaveDecisionWinner;
}

export const WaveWinnersDropHeader: React.FC<WaveWinnersDropHeaderProps> = ({
  winner,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="tw-flex tw-flex-wrap sm:tw-flex-nowrap tw-items-center tw-gap-x-4 tw-gap-y-4"
    >
      <WaveWinnersDropHeaderRank winner={winner} />

      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <div className="tw-flex tw-items-center tw-gap-3.5 tw-no-underline group">
          <WaveWinnersDropHeaderAuthorPfp winner={winner} />
          <div className="tw-flex tw-flex-col tw-gap-y-1.5 sm:tw-gap-y-0">
            <WaveWinnersDropHeaderAuthorHandle winner={winner} />
            <WaveWinnersDropHeaderCreated winner={winner} />
          </div>
        </div>

        <div className="tw-justify-end tw-flex tw-items-center tw-gap-x-4 tw-gap-y-2 tw-flex-wrap">
          <WaveWinnersDropHeaderTotalVotes winner={winner} />
          <WaveWinnersDropHeaderVoters winner={winner} />
        </div>
      </div>
    </div>
  );
};
