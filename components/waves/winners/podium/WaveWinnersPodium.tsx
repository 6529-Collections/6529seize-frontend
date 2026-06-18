import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { WaveWinnersLoading } from "./WaveWinnersLoading";
import { WaveWinnersEmpty } from "./WaveWinnersEmpty";
import { WaveWinnersPodiumContent } from "./WaveWinnersPodiumContent";

interface WaveWinnersPodiumProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly winners: ApiWaveDecisionWinner[];
  readonly isLoading: boolean;
  readonly showVoteDetails?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

export const WaveWinnersPodium: React.FC<WaveWinnersPodiumProps> = ({
  onDropClick,
  winners,
  isLoading,
  showVoteDetails = true,
  outcomesVisible = true,
}) => {
  // Extract winners for the podium (or undefined if not available)
  const firstPlaceWinner = winners[0];
  const secondPlaceWinner = winners[1];
  const thirdPlaceWinner = winners[2];

  if (isLoading) {
    return <WaveWinnersLoading />;
  }

  if (!winners.length) {
    return <WaveWinnersEmpty />;
  }

  return (
    <WaveWinnersPodiumContent
      onDropClick={onDropClick}
      firstPlaceWinner={firstPlaceWinner}
      secondPlaceWinner={secondPlaceWinner}
      thirdPlaceWinner={thirdPlaceWinner}
      showVoteDetails={showVoteDetails}
      outcomesVisible={outcomesVisible}
    />
  );
};
