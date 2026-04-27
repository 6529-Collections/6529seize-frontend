"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { Children, type ReactNode } from "react";
import DropCurationButton from "../DropCurationButton";
import WaveDropReactions from "../WaveDropReactions";
import { ParticipationDropRatings } from "./ParticipationDropRatings";

interface ParticipationDropFooterProps {
  readonly drop: ExtendedDrop;
  readonly voteAction?: ReactNode;
  readonly showInteractions?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
}

export default function ParticipationDropFooter({
  drop,
  voteAction,
  showInteractions = true,
  winningThreshold,
}: ParticipationDropFooterProps) {
  const { canShowVote } = useDropInteractionRules(drop);
  const canShowCuration = drop.context_profile_context?.curatable ?? false;
  const hasRatings = drop.raters_count > 0;
  const hasWinningThreshold =
    typeof winningThreshold === "number" && winningThreshold > 0;
  const shouldShowRatings = hasRatings || hasWinningThreshold;
  const hasReactions = drop.reactions.length > 0;
  const normalizedVoteAction = Children.toArray(voteAction);
  const hasVoteAction = normalizedVoteAction.length > 0;
  const hasPrimaryActions = canShowCuration || hasVoteAction;
  const shouldShowVoteFooter =
    canShowVote && (shouldShowRatings || hasPrimaryActions);
  const shouldShowRatingsOnlyFooter = !canShowVote && shouldShowRatings;
  const shouldShowReactionsFooter =
    hasReactions || (!canShowVote && canShowCuration);

  if (!showInteractions) {
    return <div className="tw-pb-4" />;
  }

  return (
    <>
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
                />
              </div>
            )}

            {hasPrimaryActions && (
              <div className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-6 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-w-auto @[700px]:tw-border-none @[700px]:tw-px-4 @[700px]:tw-pt-0">
                <DropCurationButton
                  dropId={drop.id}
                  waveId={drop.wave.id}
                  isCuratable={canShowCuration}
                  isCurated={drop.context_profile_context?.curated ?? false}
                />
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
          />
        </div>
      )}

      {shouldShowReactionsFooter && (
        <div className="tw-ml-[3.25rem] tw-mt-4 tw-flex tw-w-[calc(100%-3.25rem)] tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4">
          {!canShowVote && (
            <DropCurationButton
              dropId={drop.id}
              waveId={drop.wave.id}
              isCuratable={canShowCuration}
              isCurated={drop.context_profile_context?.curated ?? false}
            />
          )}
          <WaveDropReactions drop={drop} />
        </div>
      )}

      {!shouldShowReactionsFooter && <div className="tw-pb-4" />}
    </>
  );
}
