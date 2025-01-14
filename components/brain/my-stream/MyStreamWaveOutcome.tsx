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
  return `tw-h-[calc(100vh-13rem)]`;
};

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  const capacitor = useCapacitor();

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto ${calculateHeight(
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
