import React from "react";
import { Wave } from "../../../generated/models/Wave";
import { WaveDetailedView } from "./WaveDetailed";
import { WaveDetailedMobileView } from "./WaveDetailedMobile";
import WaveDetailedAbout from "./WaveDetailedAbout";

interface WaveDetailedMobileAboutProps {
  readonly wave: Wave;
  readonly showRequiredMetadata: boolean;
  readonly showRequiredTypes: boolean;
  readonly setView: (view: WaveDetailedView) => void;
  readonly setActiveView: (view: WaveDetailedMobileView) => void;
  readonly onWaveChange: (wave: Wave) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}

const WaveDetailedMobileAbout: React.FC<WaveDetailedMobileAboutProps> = ({
  wave,
  showRequiredMetadata,
  showRequiredTypes,
  setView,
  setActiveView,
  onWaveChange,
  setIsLoading,
}) => {
  return (
    <div className="tw-px-4 md:tw-px-2 tw-mt-4">
      <div className="tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4 tw-pb-4">
        <WaveDetailedAbout
          wave={wave}
          setView={setView}
          setActiveView={setActiveView}
          showRequiredMetadata={showRequiredMetadata}
          showRequiredTypes={showRequiredTypes}
          onWaveChange={onWaveChange}
          setIsLoading={setIsLoading}
        />
      </div>
    </div>
  );
};

export default WaveDetailedMobileAbout;
