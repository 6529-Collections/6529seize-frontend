import React from "react";
import { createPortal } from "react-dom";
import {
  ExtendedDrop,
  convertApiDropToExtendedDrop,
} from "../../../../helpers/waves/drop.helpers";
import { WaveWinnersDropHeader } from "./header/WaveWinnersDropHeader";
import { WaveWinnersDropContent } from "./WaveWinnersDropContent";
import WaveWinnersDropOutcome from "./header/WaveWinnersDropOutcome";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";
import WaveWinnersDropHeaderTotalVotes from "./header/WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./header/WaveWinnersDropHeaderVoters";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import useLongPressInteraction from "../../../../hooks/useLongPressInteraction";
import WaveDropActionsOpen from "../../../waves/drops/WaveDropActionsOpen";
import CommonDropdownItemsMobileWrapper from "../../../utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import WaveDropMobileMenuOpen from "../../../waves/drops/WaveDropMobileMenuOpen";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

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
  // Get device info from useDeviceInfo hook
  const { hasTouchScreen } = useDeviceInfo();

  // Use long press interaction hook with touch screen info from device hook
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
  });

  const shadowClass = getRankShadowClass(winner.place);

  // Convert the drop to ExtendedDrop using the helper function
  const extendedDrop = convertApiDropToExtendedDrop(winner.drop);

  // Check if user has voted
  const hasUserVoted =
    winner.drop.context_profile_context?.rating !== undefined &&
    winner.drop.context_profile_context?.rating !== 0;
  const userVote = winner.drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;
  const creditType = winner.drop.wave.voting_credit_type || "votes";

  return (
    <div
      onClick={() => onDropClick(extendedDrop)}
      className={`tw-group tw-cursor-pointer tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-border-transparent tw-border-l ${shadowClass}`}
    >
      <div className="tw-rounded-xl tw-p-4" {...touchHandlers}>
        <div className="tw-flex tw-justify-between tw-gap-x-3 tw-relative tw-z-10 tw-w-full tw-text-left tw-bg-transparent tw-border-0">
          <div className="tw-flex tw-gap-x-3 tw-flex-1">
            <WaveWinnersDropHeaderAuthorPfp winner={winner} />
            <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
              <WaveWinnersDropHeader winner={winner} showVotingInfo={false} />
              <WaveWinnersDropContent winner={winner} isCompetitionDrop={true} />
            </div>
          </div>

          {/* Show open icon when not a touch device */}
          {!hasTouchScreen && (
            <div className="tw-flex tw-items-start tw-flex-shrink-0">
              <div className="tw-h-8">
                <WaveDropActionsOpen drop={extendedDrop} />
              </div>
            </div>
          )}
        </div>
        <div className="tw-mt-3 tw-ml-[3.25rem]">
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
              <div className="tw-flex tw-flex-whitespace-nowrap tw-gap-x-4 tw-items-center">
                <WaveWinnersDropHeaderTotalVotes winner={winner} />
                <WaveWinnersDropHeaderVoters winner={winner} />
              </div>
              <div>
                <WaveWinnersDropOutcome winner={winner} />
              </div>
            </div>

            {/* User's vote */}
            {hasUserVoted && (
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <div className="tw-flex tw-items-baseline tw-gap-x-1">
                  <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                    Your vote:
                  </span>
                  <span
                    className={`tw-text-sm tw-font-semibold ${
                      isUserVoteNegative
                        ? "tw-text-rose-500"
                        : "tw-text-emerald-500"
                    }`}
                  >
                    {isUserVoteNegative && "-"}
                    {formatNumberWithCommas(Math.abs(userVote))}{" "}
                    <span className="tw-text-iron-400 tw-font-normal">
                      {creditType}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Touch slide-up menu */}
      {hasTouchScreen &&
        createPortal(
          <CommonDropdownItemsMobileWrapper
            isOpen={isActive}
            setOpen={setIsActive}
          >
            <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
              {/* Open drop option */}
              <WaveDropMobileMenuOpen
                drop={extendedDrop}
                onOpenChange={() => setIsActive(false)}
              />
            </div>
          </CommonDropdownItemsMobileWrapper>,
          document.body
        )}
    </div>
  );
};
