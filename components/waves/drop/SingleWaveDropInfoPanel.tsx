"use client";

import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import VotingModal from "@/components/voting/VotingModal";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useState } from "react";
import { SingleWaveDropContent } from "./SingleWaveDropContent";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { WaveDropMetaRow } from "./WaveDropMetaRow";
import { WaveDropVoteSummary } from "./WaveDropVoteSummary";

interface SingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
}

export const SingleWaveDropInfoPanel = ({
  drop,
}: SingleWaveDropInfoPanelProps) => {
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const { canDelete, canShowVote, isVotingEnded, isWinner } =
    useDropInteractionRules(drop);
  const isChatWave = drop.drop_type === ApiDropType.Chat;

  return (
    <>
      <SingleWaveDropInfoContainer>
        <div className="tw-px-4 tw-pb-8 @[640px]:tw-px-8 @[640px]:tw-pb-10">
          <div className="tw-mx-auto tw-max-w-3xl">
            <div className="tw-mb-6">
              <SingleWaveDropContent drop={drop} />
            </div>

            {!isChatWave && (
              <div className="tw-mb-6">
                <WaveDropVoteSummary
                  drop={drop}
                  isWinner={isWinner}
                  isVotingEnded={isVotingEnded}
                  canShowVote={canShowVote}
                  onVoteClick={() => setIsVotingOpen(true)}
                />
              </div>
            )}

            <WaveDropMetaRow drop={drop} isWinner={isWinner} />

            {!isChatWave && (
              <div className="tw-mt-6">
                <SingleWaveDropInfoDetails drop={drop} />
              </div>
            )}
            {canDelete && drop.drop_type !== ApiDropType.Winner && (
              <div className="tw-w-full tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pb-6 tw-pt-6">
                <WaveDropDeleteButton drop={drop} />
              </div>
            )}
          </div>
        </div>
      </SingleWaveDropInfoContainer>

      {!isChatWave && (
        <VotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={() => setIsVotingOpen(false)}
        />
      )}
    </>
  );
};
