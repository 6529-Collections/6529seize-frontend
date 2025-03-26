import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveWinnersDropHeader } from "./header/WaveWinnersDropHeader";
import { WaveWinnersDropContent } from "./WaveWinnersDropContent";
import WaveWinnersDropOutcome from "./header/WaveWinnersDropOutcome";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";
import WaveWinnersDropHeaderTotalVotes from "./header/WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./header/WaveWinnersDropHeaderVoters";

interface DefaultWaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const getRankShadowClass = (place: number | null): string => {
  if (!place)
    return "tw-shadow-[inset_1px_0_0_#60606C,inset_0_1px_0_rgba(96,96,108,0.2),inset_-1px_0_0_rgba(96,96,108,0.2),inset_0_-1px_0_rgba(96,96,108,0.2)]";

  switch (place) {
    case 1:
      return "tw-shadow-[inset_1px_0_0_#fbbf24,inset_0_1px_0_rgba(251,191,36,0.2),inset_-1px_0_0_rgba(251,191,36,0.2),inset_0_-1px_0_rgba(251,191,36,0.2)]";
    case 2:
      return "tw-shadow-[inset_1px_0_0_#94a3b8,inset_0_1px_0_rgba(148,163,184,0.2),inset_-1px_0_0_rgba(148,163,184,0.2),inset_0_-1px_0_rgba(148,163,184,0.2)]";
    case 3:
      return "tw-shadow-[inset_1px_0_0_#CD7F32,inset_0_1px_0_rgba(205,127,50,0.2),inset_-1px_0_0_rgba(205,127,50,0.2),inset_0_-1px_0_rgba(205,127,50,0.2)]";
    default:
      return "tw-shadow-[inset_1px_0_0_#60606C,inset_0_1px_0_rgba(96,96,108,0.2),inset_-1px_0_0_rgba(96,96,108,0.2),inset_0_-1px_0_rgba(96,96,108,0.2)]";
  }
};

export const DefaultWaveWinnersDrop: React.FC<DefaultWaveWinnersDropProps> = ({
  winner,
  onDropClick,
}) => {
  const shadowClass = getRankShadowClass(winner.place);

  return (
    <div
      onClick={() =>
        onDropClick({
          ...winner.drop,
          stableKey: winner.drop.id,
          stableHash: winner.drop.id,
        })
      }
      className={`tw-group tw-cursor-pointer tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-border-transparent tw-border-l ${shadowClass}`}
    >
      <div className="tw-rounded-xl tw-p-4">
        <div className="tw-flex tw-gap-x-3 tw-relative tw-z-10 tw-w-full tw-text-left tw-bg-transparent tw-border-0">
          <WaveWinnersDropHeaderAuthorPfp winner={winner} />
          <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
            <WaveWinnersDropHeader winner={winner} showVotingInfo={false} />
            <WaveWinnersDropContent winner={winner} />
          </div>
        </div>
        <div className="tw-mt-3 tw-ml-[3.25rem]">
          <div className="tw-flex tw-items-center tw-flex-wrap tw-justify-between tw-gap-x-4 tw-gap-y-2">
            <div className="tw-flex tw-flex-whitespace-nowrap tw-gap-x-4 tw-items-center">
              <WaveWinnersDropHeaderTotalVotes winner={winner} />
              <WaveWinnersDropHeaderVoters winner={winner} />
            </div>
            <div className="tw-whitespace-nowrap">
              <WaveWinnersDropOutcome winner={winner} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
