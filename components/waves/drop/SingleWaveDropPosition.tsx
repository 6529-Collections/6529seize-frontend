import React from "react";
import { DropTrophyIcon } from "../DropThrophyIcon";

interface SingleWaveDropPositionProps {
  readonly rank: number | null;
}

export const SingleWaveDropPosition: React.FC<SingleWaveDropPositionProps> = ({ rank }) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
      <DropTrophyIcon rank={rank} />
    </div>
  );
}; 