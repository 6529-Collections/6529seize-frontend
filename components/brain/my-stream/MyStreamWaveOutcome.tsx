import React, { useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import useCapacitor from "../../../hooks/useCapacitor";
import { WaveOutcome } from "../../waves/outcome/WaveOutcome";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
}

const calculateHeight = (isCapacitor: boolean, isMemesWave: boolean) => {
  if (isCapacitor) {
    return isMemesWave 
      ? "tw-h-[calc(100vh-21rem)]"  // More space for Memes wave header
      : "tw-h-[calc(100vh-18rem)]";
  }
  
  if (isMemesWave) {
    // Account for the title and button in Memes waves
    return `tw-h-[calc(100vh-15rem)] lg:tw-h-[calc(100vh-13rem)] min-[1200px]:tw-h-[calc(100vh-15.5rem)]`;
  }
  
  // Original heights for non-Memes waves
  return `tw-h-[calc(100vh-10.25rem)] min-[1200px]:tw-h-[calc(100vh-11.5rem)] lg:tw-pr-2`;
};

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  const capacitor = useCapacitor();

  // Check if this is the specific Memes wave
  const isMemesWave = wave.id.toLowerCase() === "87eb0561-5213-4cc6-9ae6-06a3793a5e58";
  
  const containerClassName = useMemo(() => {
    return `lg:tw-pt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 ${calculateHeight(
      capacitor.isCapacitor,
      isMemesWave
    )}`;
  }, [capacitor.isCapacitor, isMemesWave]);
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
