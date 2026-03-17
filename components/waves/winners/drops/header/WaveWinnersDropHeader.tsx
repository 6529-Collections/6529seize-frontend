import React from "react";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";
import WaveWinnersDropHeaderAuthorHandle from "./WaveWinnersDropHeaderAuthorHandle";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

interface WaveWinnersDropHeaderProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly showVotingInfo?: boolean | undefined;
}

export const WaveWinnersDropHeader: React.FC<WaveWinnersDropHeaderProps> = ({
  winner,
  showVotingInfo = true,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="tw-flex tw-w-full tw-flex-wrap tw-justify-between tw-gap-y-2 xl:tw-flex-nowrap"
    >
      <div className="tw-flex tw-w-full tw-flex-col tw-items-start tw-gap-y-2.5 xl:tw-w-auto">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WaveWinnersDropHeaderAuthorHandle winner={winner} />
          <DropAuthorBadges
            profile={winner.drop.author}
            tooltipIdPrefix={`winner-author-badges-${winner.drop.id}`}
          />
          <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>
          <WaveDropTime timestamp={winner.drop.created_at} />
        </div>

        <WinnerDropBadge
          rank={winner.place}
          decisionTime={winner.drop.winning_context?.decision_time ?? null}
        />
      </div>

      {showVotingInfo && (
        <div className="tw-mt-1 tw-whitespace-nowrap sm:tw-mt-0">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-2 sm:tw-gap-x-4 xl:tw-flex-nowrap">
            <WaveWinnersDropHeaderTotalVotes winner={winner} />
            <WaveWinnersDropHeaderVoters winner={winner} />
          </div>
        </div>
      )}
    </div>
  );
};
