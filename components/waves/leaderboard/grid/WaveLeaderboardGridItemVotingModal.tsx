"use client";

import { MobileVotingModal, VotingModal } from "@/components/voting";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import React from "react";

interface WaveLeaderboardGridItemVotingModalProps {
  readonly drop: ExtendedDrop;
  readonly isOpen: boolean;
  readonly isMobileScreen: boolean;
  readonly onClose: () => void;
}

export const WaveLeaderboardGridItemVotingModal: React.FC<
  WaveLeaderboardGridItemVotingModalProps
> = ({ drop, isOpen, isMobileScreen, onClose }) => {
  return isMobileScreen ? (
    <MobileVotingModal drop={drop} isOpen={isOpen} onClose={onClose} />
  ) : (
    <VotingModal drop={drop} isOpen={isOpen} onClose={onClose} />
  );
};
