import React, { useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveOutcome } from "../../waves/outcome/WaveOutcome";
import { ContentView, useContentHeight } from "../../../hooks/useContentHeight";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
  // Stable measurements from parent
  readonly tabsHeight?: number;
}

// Removed in favor of useWaveViewHeight hook

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave, tabsHeight }) => {
  // Check if this is the specific Memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  // Use the content height hook
  const { heightStyle, ready } = useContentHeight({
    view: ContentView.OUTCOME,
    isMemesWave,
    componentId: `wave-outcome-${wave.id}`
  });
  
  const containerClassName = useMemo(() => {
    return `lg:tw-pt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-flex-grow lg:tw-pr-2`;
  }, []);
  return (
    <div className={containerClassName} style={heightStyle}>
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
