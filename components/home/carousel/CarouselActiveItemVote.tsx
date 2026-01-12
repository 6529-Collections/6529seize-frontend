"use client";

import { useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveDropVoteSummary } from "@/components/waves/drop/WaveDropVoteSummary";
import { VotingModal, MobileVotingModal } from "@/components/voting";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

interface CarouselActiveItemVoteProps {
  readonly drop: ExtendedDrop | null;
}

export default function CarouselActiveItemVote({
  drop,
}: CarouselActiveItemVoteProps) {
  if (!drop) {
    return null;
  }

  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const isMobileScreen = useIsMobileScreen();
  const { canShowVote, isVotingEnded, isWinner } =
    useDropInteractionRules(drop);

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-mt-4">
      <WaveDropVoteSummary
        drop={drop}
        isWinner={isWinner}
        isVotingEnded={isVotingEnded}
        canShowVote={canShowVote}
        onVoteClick={() => setIsVotingOpen(true)}
        variant="memes"
      />

      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={() => setIsVotingOpen(false)}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={() => setIsVotingOpen(false)}
        />
      )}
    </div>
  );
}
