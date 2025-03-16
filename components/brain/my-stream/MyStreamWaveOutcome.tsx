import React, { useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveOutcome } from "../../waves/outcome/WaveOutcome";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
}

// Removed in favor of useWaveViewHeight hook

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  // Get the pre-calculated style from LayoutContext
  const { outcomeContainerStyle } = useLayout();
  
  const containerClassName = useMemo(() => {
    return `lg:tw-pt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-flex-grow lg:tw-pr-2`;
  }, []);
  return (
    <div className={containerClassName} style={outcomeContainerStyle}>
      <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-space-y-4">
        {wave.outcomes.map((outcome, index) => (
          <WaveOutcome
            key={`${outcome.credit}-${outcome.type}-${index}`}
            outcome={outcome}
          />
        ))}
      </div>
    </div>
  );
};

export default MyStreamWaveOutcome;
