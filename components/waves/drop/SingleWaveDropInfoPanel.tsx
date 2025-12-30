"use client";

import { useState } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropContent } from "./SingleWaveDropContent";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import VotingModal from "@/components/voting/VotingModal";
import { WaveDropVoteSummary } from "./WaveDropVoteSummary";
import { WaveDropMetaRow } from "./WaveDropMetaRow";

interface SingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
}

export const SingleWaveDropInfoPanel = ({
  drop,
}: SingleWaveDropInfoPanelProps) => {
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const { canDelete, canShowVote, isVotingEnded, isWinner } =
    useDropInteractionRules(drop);

  return (
    <>
      <SingleWaveDropInfoContainer>
        <div className="tw-px-4 @[640px]:tw-px-8 tw-pb-8 @[640px]:tw-pb-10">
          <div className="tw-max-w-3xl tw-mx-auto">
            <div className="tw-mb-6">
              <SingleWaveDropContent drop={drop} />
            </div>

            <div className="tw-mb-6">
              <WaveDropVoteSummary
                drop={drop}
                isWinner={isWinner}
                isVotingEnded={isVotingEnded}
                canShowVote={canShowVote}
                onVoteClick={() => setIsVotingOpen(true)}
              />
            </div>

            <WaveDropMetaRow drop={drop} isWinner={isWinner} />

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
