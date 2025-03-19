import React from "react";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

interface SingleWaveDropPositionProps {
  readonly rank: number | null;
}

export const SingleWaveDropPosition: React.FC<SingleWaveDropPositionProps> = ({ rank }) => {
  if (!rank) return null;
  
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
      <WinnerDropBadge rank={rank} decisionTime={null} />
    </div>
  );
}; 