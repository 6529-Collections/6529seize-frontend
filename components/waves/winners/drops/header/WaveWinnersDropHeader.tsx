import React from "react";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";
import WaveWinnersDropHeaderAuthorHandle from "./WaveWinnersDropHeaderAuthorHandle";
import WaveWinnersDropHeaderCreated from "./WaveWinnersDropHeaderCreated";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import WinnerDropBadge from "../../../drops/winner/WinnerDropBadge";

interface WaveWinnersDropHeaderProps {
  readonly winner: ApiWaveDecisionWinner;
}

export const WaveWinnersDropHeader: React.FC<WaveWinnersDropHeaderProps> = ({
  winner,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="tw-flex tw-flex-wrap md:tw-flex-nowrap tw-gap-y-1 tw-justify-between tw-w-full"
    >
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-w-full">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WaveWinnersDropHeaderAuthorHandle winner={winner} />
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <WaveWinnersDropHeaderCreated winner={winner} />
          <div className="tw-ml-2">
            <WinnerDropBadge rank={winner.place} decisionTime={winner.drop.winning_context?.decision_time || null} />
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
