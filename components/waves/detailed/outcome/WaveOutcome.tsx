import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { WaveDetailedOutcome } from "./WaveDetailedOutcome";
import useCapacitor from "../../../../hooks/useCapacitor";

interface WaveOutcomeProps {
  readonly wave: ApiWave;
  readonly children?: React.ReactNode;
}

export const WaveOutcome: React.FC<WaveOutcomeProps> = ({
  wave,
  children,
}) => {
  const capacitor = useCapacitor();

  const contentHeight = capacitor.isCapacitor
    ? "tw-h-[calc(100vh-16rem)]"
    : "tw-h-[calc(100vh-8.5rem)]";

  return (
    <>
      <div className="tw-w-full lg:tw-ml-[21.5rem] tw-transition-all tw-duration-300 lg:tw-pl-4 lg:tw-pr-4">
        {children}
        <div className={`tw-w-full no-scrollbar tw-overflow-y-auto ${contentHeight} tw-pb-6 tw-px-2 lg:tw-px-0 tw-pt-4 tw-space-y-4`}>
          {wave.outcomes.map((outcome, index) => (
            <WaveDetailedOutcome
              key={`${outcome.credit}-${outcome.type}-${index}`}
              outcome={outcome}
            />
          ))}
        </div>
      </div>
    </>
  );
};
