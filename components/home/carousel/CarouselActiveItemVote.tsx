"use client";

import { useCallback, useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveDropVoteSummary } from "@/components/waves/drop/WaveDropVoteSummary";
import { VotingModal, MobileVotingModal } from "@/components/voting";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

interface CarouselActiveItemVoteProps {
  readonly drop: ExtendedDrop;
  readonly onVoteOpen?: (() => void) | undefined;
  readonly onVoteClose?: (() => void) | undefined;
}

export default function CarouselActiveItemVote({
  drop,
  onVoteOpen,
  onVoteClose,
}: CarouselActiveItemVoteProps) {
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [lockedDrop, setLockedDrop] = useState<ExtendedDrop | null>(null);
  const isMobileScreen = useIsMobileScreen();
  const { canShowVote, isVotingEnded, isWinner } =
    useDropInteractionRules(drop);
  const modalDrop = lockedDrop ?? drop;

  const handleOpenVote = useCallback(() => {
    setLockedDrop(drop);
    setIsVotingOpen(true);
    onVoteOpen?.();
  }, [drop, onVoteOpen]);

  const handleCloseVote = useCallback(() => {
    setIsVotingOpen(false);
    setLockedDrop(null);
    onVoteClose?.();
  }, [onVoteClose]);

  return (
    <div className="tw-mt-4 tw-flex tw-items-center tw-justify-center tw-px-4 md:tw-px-6 lg:tw-px-8">
      <WaveDropVoteSummary
        drop={drop}
        isWinner={isWinner}
        isVotingEnded={isVotingEnded}
        canShowVote={canShowVote}
        onVoteClick={handleOpenVote}
      />

      {isVotingOpen &&
        (isMobileScreen ? (
          <MobileVotingModal
            drop={modalDrop}
            isOpen={true}
            onClose={handleCloseVote}
          />
        ) : (
          <VotingModal
            drop={modalDrop}
            isOpen={true}
            onClose={handleCloseVote}
          />
        ))}
    </div>
  );
}
