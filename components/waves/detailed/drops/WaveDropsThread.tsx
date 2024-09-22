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
    <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-iron-950 tw-border-b tw-border-x-0 tw-border-t-0 tw-mb-2 tw-border-iron-700 tw-border-solid">
      {onBackToList && <WaveDropsBackButton onBackToList={onBackToList} />}
      <WaveDropThreadTrace rootDropId={rootDropId} wave={wave} />
    </div>
  );
};

export default WaveDropsThreadHeader;
