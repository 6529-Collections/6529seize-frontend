import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import React from "react";
import WaveWinnersDropHeaderAuthorHandle from "./WaveWinnersDropHeaderAuthorHandle";
import WaveWinnersDropHeaderTotalVotes from "./WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./WaveWinnersDropHeaderVoters";

interface WaveWinnersDropHeaderProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly showVotingInfo?: boolean | undefined;
  readonly isApprovalWave?: boolean | undefined;
}

export const WaveWinnersDropHeader: React.FC<WaveWinnersDropHeaderProps> = ({
  winner,
  showVotingInfo = true,
  isApprovalWave = false,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="tw-flex tw-w-full tw-flex-wrap tw-justify-between tw-gap-y-2 xl:tw-flex-nowrap"
    >
      <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 xl:tw-w-auto">
        <WaveWinnersDropHeaderAuthorHandle winner={winner} />
        <DropAuthorBadges
          profile={winner.drop.author}
          wave={winner.drop.wave}
          tooltipIdPrefix={`winner-author-badges-${winner.drop.id}`}
        />
        {isApprovalWave ? (
          <ApprovalStatusBadge
            approvedAt={winner.drop.winning_context?.decision_time ?? null}
          />
        ) : (
          <WinnerDropBadge
            rank={winner.place}
            decisionTime={winner.drop.winning_context?.decision_time ?? null}
          />
        )}
        <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700"></div>
        <WaveDropTime timestamp={winner.drop.created_at} />
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
