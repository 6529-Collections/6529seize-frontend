"use client";

import React, { useState } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropContent } from "./SingleWaveDropContent";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";
import VotingModal from "@/components/voting/VotingModal";
import WaveDropTime from "../drops/time/WaveDropTime";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { WinnerBadge } from "./WinnerBadge";

interface SingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
}

export const SingleWaveDropInfoPanel: React.FC<SingleWaveDropInfoPanelProps> = ({
  drop,
}) => {
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const { canDelete, canShowVote, isVotingEnded, isWinner } =
    useDropInteractionRules(drop);

  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;
  const shouldShowUserVote = (isVotingEnded || isWinner) && hasUserVoted;

  return (
    <>
      <SingleWaveDropInfoContainer>
        <div className="tw-px-4 @[640px]:tw-px-8 tw-pb-8 @[640px]:tw-pb-10">
          <div className="tw-max-w-3xl tw-mx-auto">
            {/* Content */}
            <div className="tw-mb-6">
              <SingleWaveDropContent drop={drop} />
            </div>

            {/* Vote Bar */}
            <div className="tw-mb-6">
              <div className="tw-inline-flex tw-items-center tw-gap-3 tw-p-1.5 tw-bg-iron-950 tw-border tw-border-solid tw-border-white/10 tw-rounded-lg tw-shadow-2xl">
                <div className="tw-px-4 tw-flex tw-items-baseline tw-gap-1.5 tw-cursor-default">
                  <span className="tw-text-base tw-font-bold tw-text-white tw-tabular-nums">
                    {formatNumberWithCommas(drop.rating)}
                  </span>
                  {drop.rating !== drop.rating_prediction && (
                    <>
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="tw-flex-shrink-0 tw-size-2.5 tw-text-iron-600"
                      />
                      <span
                        className={`tw-text-base tw-font-bold tw-tabular-nums tw-cursor-help ${
                          drop.rating < drop.rating_prediction
                            ? "tw-text-emerald-400"
                            : "tw-text-rose-400"
                        }`}
                        data-tooltip-id={`drop-vote-progress-${drop.id}`}
                      >
                        {formatNumberWithCommas(drop.rating_prediction)}
                      </span>
                      <Tooltip
                        id={`drop-vote-progress-${drop.id}`}
                        place="top"
                        offset={8}
                        opacity={1}
                        style={{
                          padding: "4px 8px",
                          background: "#37373E",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: 500,
                          borderRadius: "6px",
                          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                          zIndex: 99999,
                          pointerEvents: "none",
                        }}
                      >
                        Projected vote count at decision time
                      </Tooltip>
                    </>
                  )}
                  <span className="tw-text-sm tw-text-iron-500 tw-font-normal">
                    {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]} Total
                  </span>
                </div>

                {shouldShowUserVote && (
                  <div className="tw-px-4 tw-flex tw-items-baseline tw-gap-1 tw-border-l tw-border-solid tw-border-white/5 tw-border-y-0 tw-border-r-0">
                    <span className="tw-text-sm tw-font-normal tw-text-iron-500">
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
                      {formatNumberWithCommas(Math.abs(userVote))}
                    </span>
                    <span className="tw-text-iron-500 tw-text-sm tw-font-normal">
                      {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
                    </span>
                  </div>
                )}

                {canShowVote && (
                  <button
                    type="button"
                    onClick={() => setIsVotingOpen(true)}
                    className="tw-px-6 tw-py-2.5 tw-text-sm tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white tw-flex tw-items-center tw-cursor-pointer tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out"
                  >
                    Vote
                  </button>
                )}
              </div>
            </div>

            {/* Author row with rank and timestamp */}
            <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
              <SingleWaveDropInfoAuthorSection drop={drop} />
              <span className="tw-text-white/40">·</span>
              <WaveDropTime timestamp={drop.created_at} size="sm" />
              {isWinner && (
                <>
                  <span className="tw-text-white/40">·</span>
                  <WinnerBadge drop={drop} variant="simple" />
                </>
              )}
              {!isWinner && drop?.drop_type === ApiDropType.Participatory && (
                <>
                  <span className="tw-text-white/40">·</span>
                  <SingleWaveDropPosition rank={drop.rank} variant="simple" />
                </>
              )}
            </div>

            <div className="tw-mt-6">
              <SingleWaveDropInfoDetails drop={drop} />
            </div>
            {canDelete && drop.drop_type !== ApiDropType.Winner && (
              <div className="tw-w-full tw-pb-6 tw-pt-6 tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0">
                <WaveDropDeleteButton drop={drop} />
              </div>
            )}
          </div>
        </div>
      </SingleWaveDropInfoContainer>

      <VotingModal
        drop={drop}
        isOpen={isVotingOpen}
        onClose={() => setIsVotingOpen(false)}
      />
    </>
  );
};
