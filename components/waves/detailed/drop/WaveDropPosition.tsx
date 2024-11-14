import React from "react";
import { DropTrophyIcon } from "../../utils/DropThrophyIcon";

interface WaveDropPositionProps {
  readonly rank: number | null;
}

export const WaveDropPosition: React.FC<WaveDropPositionProps> = ({ rank }) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
      <DropTrophyIcon rank={rank} />
    </div>
  );
};
