import React, { useMemo } from "react";
import { WaveDetailedOutcome } from "../../waves/detailed/outcome/WaveDetailedOutcome";
import { ApiWave } from "../../../generated/models/ApiWave";
import useCapacitor from "../../../hooks/useCapacitor";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
}

const calculateHeight = (isCapacitor: boolean) => {
  if (isCapacitor) {
    return "tw-h-[calc(100vh-18.75rem)]";
  }
  return `tw-h-[calc(100vh-12.5rem)] tw-pr-2`;
};

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  const capacitor = useCapacitor();

  const containerClassName = useMemo(() => {
    return `tw-mt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-space-y-4 ${calculateHeight(
      capacitor.isCapacitor
    )}`;
  }, [capacitor.isCapacitor]);
  return (
    <div className={containerClassName}>
      {wave.outcomes.map((outcome, index) => (
        <WaveDetailedOutcome
          key={`${outcome.credit}-${outcome.type}-${index}`}
          outcome={outcome}
        />
      ))}
    </div>
  );
};

export default MyStreamWaveOutcome;
