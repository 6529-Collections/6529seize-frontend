import React from "react";
import { WaveDropsBackButton } from "./WaveDropsBackButton";
import WaveDropThreadTrace from "./WaveDropThreadTrace";
import { Wave } from "../../../../generated/models/Wave";

interface WaveDropsThreadHeaderProps {
  readonly rootDropId: string | null;
  readonly wave: Wave;
  readonly onBackToList?: () => void;
}

const WaveDropsThreadHeader: React.FC<WaveDropsThreadHeaderProps> = ({
  rootDropId,
  wave,
  onBackToList,
}) => {
  if (!rootDropId) return null;

  return (
    <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950">
      {onBackToList && <WaveDropsBackButton onBackToList={onBackToList} />}
      <WaveDropThreadTrace rootDropId={rootDropId} wave={wave} />
    </div>
  );
};

export default WaveDropsThreadHeader;
