import React, { useMemo } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import useCapacitor from "../../../hooks/useCapacitor";
import { WaveOutcome } from "../../waves/outcome/WaveOutcome";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
}

const calculateHeight = (platform: string, keyboardVisible: boolean) => {
  if (platform === "ios") {
    if (keyboardVisible) {
      return "tw-h-[calc(100vh-16rem)]";
    }
    return "tw-h-[calc(100vh-18rem)]";
  } else if (platform === "android") {
    if (keyboardVisible) {
      return "tw-h-[calc(100vh-12.5rem)]";
    }
    return "tw-h-[calc(100vh-16.5rem)]";
  }
  return `tw-h-[calc(100vh-10.25rem)] min-[1200px]:tw-h-[calc(100vh-11.5rem)] lg:tw-pr-2`;
};

const MyStreamWaveOutcome: React.FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  const capacitor = useCapacitor();

  const containerClassName = useMemo(() => {
    return `lg:tw-pt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 ${calculateHeight(
      capacitor.platform,
      capacitor.keyboardVisible
    )}`;
  }, [capacitor.platform, capacitor.keyboardVisible]);
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
