import React, { useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveOutcome } from "../../waves/outcome/WaveOutcome";
import { WaveView, useWaveViewHeight } from "../../../hooks/useWaveViewHeight";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
}

// Removed in favor of useWaveViewHeight hook

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  // Check if this is the specific Memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  // Use the hook to calculate height
  const viewHeight = useWaveViewHeight(WaveView.OUTCOME, {
    isMemesWave
  });
  
  const containerClassName = useMemo(() => {
    return `lg:tw-pt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 ${viewHeight} lg:tw-pr-2`;
  }, [viewHeight]);
  return (
    <div className={containerClassName}>
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
