"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { Children, type ReactNode } from "react";
import WaveDropReactions from "../WaveDropReactions";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

interface ParticipationDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly voteAction?: ReactNode;
  readonly showInteractions?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export default function ParticipationDropFooter({
  drop,
  voteAction,
  showInteractions = true,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}: ParticipationDropFooterProps) {
  const { canShowVote } = useDropInteractionRules(drop);
  const isVotingActionLocked = isVotingClosed || isVotingControlsLocked;
  const canShowVoting = canShowVote && !isVotingActionLocked;
  const hasRatings = drop.raters_count > 0;
  const hasWinningThreshold =
    typeof winningThreshold === "number" && winningThreshold > 0;
  const shouldShowRatings = hasRatings || hasWinningThreshold;
  const hasReactions = drop.reactions.length > 0;
  const normalizedVoteAction = Children.toArray(voteAction);
  const hasVoteAction = normalizedVoteAction.length > 0;
  const primaryActionsJustificationClass = hasWinningThreshold
    ? "tw-justify-end"
    : "tw-justify-center";
  const shouldShowVoteFooter =
    canShowVoting && (shouldShowRatings || hasVoteAction);
  const shouldShowRatingsOnlyFooter = !canShowVoting && shouldShowRatings;
  const shouldShowReactionsFooter = hasReactions;
  const shouldShowReactionsBeforeVoteFooter =
    hasWinningThreshold && shouldShowVoteFooter && shouldShowReactionsFooter;

  if (!showInteractions) {
    return <div className="tw-pb-4" />;
  }

  return (
    <>
      {shouldShowReactionsBeforeVoteFooter && (
        <div className="tw-ml-[3.25rem] tw-mt-4 tw-flex tw-w-[calc(100%-3.25rem)] tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4">
          <WaveDropReactions drop={drop} />
        </div>
      )}

      {shouldShowVoteFooter && (
        <div
          className="tw-mt-4 tw-@container sm:tw-ml-[3.25rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tw-flex tw-flex-col tw-gap-x-4 tw-gap-y-3 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-justify-between">
            {shouldShowRatings && (
              <div className="tw-px-4">
                <ParticipationDropRatings
                  drop={drop}
                  rank={drop.rank}
                  winningThreshold={winningThreshold}
                  winningThresholdMinDurationMs={winningThresholdMinDurationMs}
                  isVotingClosed={isVotingClosed}
                />
              </div>
            )}

            {hasVoteAction && (
              <div
                className={`tw-flex tw-w-full tw-items-center ${primaryActionsJustificationClass} tw-gap-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-6 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-w-auto @[700px]:tw-justify-center @[700px]:tw-border-none @[700px]:tw-px-4 @[700px]:tw-pt-0`}
              >
                {normalizedVoteAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show ratings if no vote button */}
      {shouldShowRatingsOnlyFooter && (
        <div className="tw-ml-[3.25rem] tw-mt-4 tw-px-4">
          <ParticipationDropRatings
            drop={drop}
            rank={drop.rank}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
            isVotingClosed={isVotingClosed}
          />
        </div>
      )}

      {shouldShowReactionsFooter && !shouldShowReactionsBeforeVoteFooter && (
        <div className="tw-ml-[3.25rem] tw-mt-4 tw-flex tw-w-[calc(100%-3.25rem)] tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4">
          <WaveDropReactions drop={drop} />
        </div>
      )}

      {!shouldShowReactionsFooter && <div className="tw-pb-4" />}
    </>
  );
}
