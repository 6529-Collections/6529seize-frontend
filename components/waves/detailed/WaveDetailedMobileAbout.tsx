import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveDetailedView } from "./WaveDetailed";
import { WaveDetailedMobileView } from "./WaveDetailedMobile";
import WaveDetailedAbout from "./WaveDetailedAbout";
import useCapacitor from "../../../hooks/useCapacitor";

interface WaveDetailedMobileAboutProps {
  readonly wave: ApiWave;
  readonly showRequiredMetadata: boolean;
  readonly showRequiredTypes: boolean;
  readonly setView: (view: WaveDetailedView) => void;
  readonly setActiveView: (view: WaveDetailedMobileView) => void;
  readonly onWaveChange: (wave: ApiWave) => void;
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
  const capacitor = useCapacitor();

  const containerClassName = `tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4${
    capacitor.isCapacitor ? " tw-pb-[calc(4rem+80px)]" : ""
  }`;

  return (
    <div className="tw-px-4 md:tw-px-2 tw-mt-4">
      <div className={containerClassName}>
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
