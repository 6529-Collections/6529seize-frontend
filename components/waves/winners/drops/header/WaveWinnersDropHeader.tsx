import React from "react";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";
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
      className="tw-flex tw-justify-between tw-w-full"
    >
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-w-full">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WaveWinnersDropHeaderAuthorHandle winner={winner} />
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <WaveWinnersDropHeaderCreated winner={winner} />
          <div className="tw-ml-2">
            <WaveWinnersDropHeaderRank winner={winner} />
          </div>
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-whitespace-nowrap">
        <div className="tw-flex tw-items-center tw-gap-x-4 tw-gap-y-2">
          <WaveWinnersDropHeaderTotalVotes winner={winner} />
          <WaveWinnersDropHeaderVoters winner={winner} />
        </div>
      </div>
    </div>
  );
};
