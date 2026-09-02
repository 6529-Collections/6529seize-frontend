"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { Children, type ReactNode } from "react";
import WaveDropReactions from "../WaveDropReactions";
import {
  PROPOSAL_CARD_FOOTER_CLASS,
  type DropContentPresentation,
} from "../dropContentPresentation";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

interface ParticipationDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly voteAction?: ReactNode;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly indentContent?: boolean | undefined;
  readonly inlineVotingActions?: boolean | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export default function ParticipationDropFooter({
  drop,
  voteAction,
  contentPresentation = "default",
  indentContent = true,
  inlineVotingActions = false,
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
  const isProposalCard = contentPresentation === "proposalCard";
  const isChatProposal = isProposalCard && !indentContent;
  const hasProposalVoteWithoutRatings =
    isProposalCard && hasVoteAction && !shouldShowRatings;
  const useInlineVotingLayout =
    isChatProposal || inlineVotingActions || hasProposalVoteWithoutRatings;
  const hasChatVotingSurface =
    isChatProposal && (shouldShowVoteFooter || shouldShowRatingsOnlyFooter);
  const contentOffsetClass = indentContent
    ? "tw-ml-[3.25rem] tw-w-[calc(100%-3.25rem)]"
    : "tw-w-full";
  let proposalFooterSurfaceClass = "";
  if (isChatProposal) {
    proposalFooterSurfaceClass = `${PROPOSAL_CARD_FOOTER_CLASS} tw-py-3`;
  } else if (isProposalCard) {
    proposalFooterSurfaceClass =
      "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3";
  }

  if (!showInteractions) {
    return <div className="tw-pb-4" />;
  }

  return (
    <>
      {shouldShowReactionsBeforeVoteFooter && (
        <div
          className={`${contentOffsetClass} tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4`}
        >
          <WaveDropReactions drop={drop} />
        </div>
      )}

      {shouldShowVoteFooter && (
        <div
          className={`${isProposalCard ? "tw-mt-2" : "tw-mt-4"} tw-@container ${indentContent ? "sm:tw-ml-[3.25rem]" : ""} ${proposalFooterSurfaceClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`tw-flex tw-gap-x-4 ${
              useInlineVotingLayout
                ? "tw-items-center tw-justify-between"
                : "tw-flex-col tw-gap-y-3 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-justify-between"
            }`}
          >
            {shouldShowRatings && (
              <div
                className={
                  useInlineVotingLayout
                    ? "tw-min-w-0 tw-flex-1 tw-px-4"
                    : "tw-px-4"
                }
              >
                <ParticipationDropRatings
                  drop={drop}
                  rank={drop.rank}
                  winningThreshold={winningThreshold}
                  winningThresholdMinDurationMs={winningThresholdMinDurationMs}
                  isVotingClosed={isVotingClosed}
                  emphasizeCurrent={isProposalCard}
                />
              </div>
            )}

            {hasVoteAction && (
              <div
                className={
                  useInlineVotingLayout
                    ? "tw-ml-auto tw-flex tw-w-auto tw-flex-shrink-0 tw-items-center tw-justify-end tw-gap-1.5 tw-border-0 tw-px-4 tw-pt-0"
                    : `tw-flex tw-w-full tw-items-center ${primaryActionsJustificationClass} tw-gap-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-6 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-w-auto @[700px]:tw-justify-center @[700px]:tw-border-none @[700px]:tw-px-4 @[700px]:tw-pt-0`
                }
              >
                {normalizedVoteAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show ratings if no vote button */}
      {shouldShowRatingsOnlyFooter && (
        <div
          className={`${indentContent ? "tw-ml-[3.25rem]" : ""} ${isProposalCard ? "tw-mt-2" : "tw-mt-4"} tw-px-4 ${proposalFooterSurfaceClass}`}
        >
          <ParticipationDropRatings
            drop={drop}
            rank={drop.rank}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
            isVotingClosed={isVotingClosed}
            emphasizeCurrent={isProposalCard}
          />
        </div>
      )}

      {shouldShowReactionsFooter && !shouldShowReactionsBeforeVoteFooter && (
        <div
          className={`${contentOffsetClass} tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4`}
        >
          <WaveDropReactions drop={drop} />
        </div>
      )}

      {!shouldShowReactionsFooter && !hasChatVotingSurface && (
        <div className="tw-pb-4" />
      )}
    </>
  );
}
