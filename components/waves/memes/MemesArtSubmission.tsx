import React from "react";
import MemesArtSubmissionContainer from "./submission/MemesArtSubmissionContainer";
import { TraitsData } from "./submission/types/TraitsData";

interface MemesArtSubmissionProps {
  readonly onCancel: () => void;
  readonly onSubmit: (artwork: {
    imageUrl: string;
    traits: TraitsData;
    signature: string; // Wallet signature for terms agreement
  }) => void;
}

const MemesArtSubmission: React.FC<MemesArtSubmissionProps> = ({
  onCancel,
  onSubmit,
}) => {
  return (
    <MemesArtSubmissionContainer
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
};

export default MemesArtSubmission;
