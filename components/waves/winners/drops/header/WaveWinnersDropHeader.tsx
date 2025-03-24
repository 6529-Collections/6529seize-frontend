import React from "react";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";
import WaveWinnersDropHeaderAuthorHandle from "./WaveWinnersDropHeaderAuthorHandle";
import WaveWinnersDropHeaderCreated from "./WaveWinnersDropHeaderCreated";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import WinnerDropBadge from "../../../drops/winner/WinnerDropBadge";

interface WaveWinnersDropHeaderProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly showVotingInfo?: boolean;
}

export const WaveWinnersDropHeader: React.FC<WaveWinnersDropHeaderProps> = ({
  winner,
  showVotingInfo = true,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="tw-flex tw-flex-wrap xl:tw-flex-nowrap tw-gap-y-2 tw-justify-between tw-w-full"
    >
      <div className="tw-flex tw-items-center tw-gap-x-2 tw-w-full xl:tw-w-auto">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WaveWinnersDropHeaderAuthorHandle winner={winner} />
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <WaveWinnersDropHeaderCreated winner={winner} />
        </div>

        <div className="tw-ml-2">
          <WinnerDropBadge
            rank={winner.place}
            decisionTime={winner.drop.winning_context?.decision_time || null}
          />
        </div>
      </div>

      {showVotingInfo && (
        <div className="tw-whitespace-nowrap tw-mt-1 sm:tw-mt-0">
          <div className="tw-flex tw-items-center tw-flex-wrap xl:tw-flex-nowrap tw-gap-x-2 sm:tw-gap-x-4 tw-gap-y-2">
            <WaveWinnersDropHeaderTotalVotes winner={winner} />
            <WaveWinnersDropHeaderVoters winner={winner} />
          </div>
        </div>
      )}
    </div>
  );
};
