import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { getRankHoverBorderClass } from "@/components/waves/drops/dropRankStyles";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import React from "react";
import { createPortal } from "react-dom";
import { WaveWinnersDropHeader } from "./header/WaveWinnersDropHeader";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";
import WaveWinnersDropHeaderTotalVotes from "./header/WaveWinnersDropHeaderTotalVotes";
import WaveWinnersDropHeaderVoters from "./header/WaveWinnersDropHeaderVoters";
import WaveWinnersDropOutcome from "./header/WaveWinnersDropOutcome";
import { WaveWinnersDropContent } from "./WaveWinnersDropContent";
import { WaveWinnerIdentity } from "../identity/WaveWinnerIdentity";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";

interface DefaultWaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly isApprovalWave?: boolean | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

const getRankHoverClass = (place: number | null): string => {
  return getRankHoverBorderClass(place);
};

const isClickFromCardDom = (
  event: React.MouseEvent<HTMLDivElement>
): boolean => {
  return event.currentTarget.contains(event.target as Node);
};

export const DefaultWaveWinnersDrop: React.FC<DefaultWaveWinnersDropProps> = ({
  winner,
  onDropClick,
  isApprovalWave = false,
  contentPresentation = "default",
  outcomesVisible = true,
}) => {
  // Get device info from useDeviceInfo hook
  const { hasTouchScreen } = useDeviceInfo();
  const suppressNextClickRef = React.useRef(false);

  const handleInteractionStart = React.useCallback(() => {
    suppressNextClickRef.current = true;
  }, []);

  const handleClickCapture = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isClickFromCardDom(event)) {
        return;
      }

      if (!suppressNextClickRef.current) {
        return;
      }

      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const handleMenuClickCapture = React.useCallback(() => {
    suppressNextClickRef.current = false;
  }, []);

  // Use long press interaction hook with touch screen info from device hook
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
    onInteractionStart: handleInteractionStart,
    preventDefault: false,
  });

  const handleMobileMenuOpenChange = React.useCallback(
    (nextIsActive: boolean) => {
      if (!nextIsActive) {
        suppressNextClickRef.current = false;
      }

      setIsActive(nextIsActive);
    },
    [setIsActive]
  );

  const handleMobileMenuClose = React.useCallback(() => {
    handleMobileMenuOpenChange(false);
  }, [handleMobileMenuOpenChange]);

  // Convert the drop to ExtendedDrop using the helper function
  const extendedDrop = convertApiDropToExtendedDrop(winner.drop);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isClickFromCardDom(event)) {
        return;
      }

      onDropClick(extendedDrop);
    },
    [extendedDrop, onDropClick]
  );

  // Check if user has voted
  const userContextRating = winner.drop.context_profile_context?.rating ?? 0;
  const hasUserVoted = userContextRating !== 0;
  const userVote = userContextRating;
  const isUserVoteNegative = userVote < 0;
  const creditType =
    WAVE_VOTING_LABELS[winner.drop.wave.voting_credit_type] || "votes";

  return (
    <div
      onClickCapture={handleClickCapture}
      onClick={handleClick}
      className={`tw-group tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 ${
        isApprovalWave
          ? "desktop-hover:hover:tw-border-iron-700"
          : getRankHoverClass(winner.place)
      }`}
    >
      <div className="tw-rounded-xl tw-p-4" {...touchHandlers}>
        <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-justify-between tw-gap-x-3 tw-border-0 tw-bg-transparent tw-text-left">
          <div className="tw-flex tw-flex-1 tw-gap-x-3">
            <WaveWinnersDropHeaderAuthorPfp winner={winner} />
            <div className="tw-flex tw-w-full tw-flex-col tw-gap-y-2">
              <WaveWinnersDropHeader
                winner={winner}
                showVotingInfo={false}
                isApprovalWave={isApprovalWave}
              />
              <WaveWinnersDropContent
                winner={winner}
                isCompetitionDrop={true}
                contentPresentation={contentPresentation}
              />
            </div>
          </div>

          {/* Show open icon when not a touch device */}
          {!hasTouchScreen && (
            <div className="tw-flex tw-flex-shrink-0 tw-items-start">
              <div className="tw-h-8">
                <WaveDropActionsOpen drop={extendedDrop} />
              </div>
            </div>
          )}
        </div>
        <div className="tw-ml-[3.25rem]">
          <div className="tw-flex tw-flex-col tw-gap-y-2">
            <WaveWinnerIdentity
              drop={winner.drop}
              variant="full"
              cardVariant="chat"
            />
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-pt-2">
              <div className="tw-flex tw-items-center tw-gap-x-4 tw-whitespace-nowrap">
                <WaveWinnersDropHeaderTotalVotes winner={winner} />
                <WaveWinnersDropHeaderVoters winner={winner} />
              </div>
              <div>
                <WaveWinnersDropOutcome
                  winner={winner}
                  outcomesVisible={outcomesVisible}
                />
              </div>
            </div>

            {/* User's vote */}
            {hasUserVoted && (
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <div className="tw-flex tw-items-baseline tw-gap-x-1">
                  <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                    {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
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
                    <span className="tw-font-normal tw-text-iron-400">
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
            setOpen={handleMobileMenuOpenChange}
          >
            <div
              onClickCapture={handleMenuClickCapture}
              className="tw-grid tw-grid-cols-1 tw-gap-y-2"
            >
              {/* Open drop option */}
              <WaveDropMobileMenuOpen
                drop={extendedDrop}
                onOpenChange={handleMobileMenuClose}
              />
              <WaveDropMobileMenuCopyLink
                drop={extendedDrop}
                onCopy={() => setIsActive(false)}
              />
            </div>
          </CommonDropdownItemsMobileWrapper>,
          document.body
        )}
    </div>
  );
};
