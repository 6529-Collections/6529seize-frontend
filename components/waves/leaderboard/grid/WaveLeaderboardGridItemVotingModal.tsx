"use client";

import { VotingModal } from "@/components/voting";
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
  return (
    <VotingModal
      drop={drop}
      isOpen={isOpen}
      onClose={onClose}
      preferMobile={isMobileScreen}
    />
  );
};
