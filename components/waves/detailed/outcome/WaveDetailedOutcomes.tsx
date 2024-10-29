import { FC } from "react";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import { WaveDetailedOutcome } from "./WaveDetailedOutcome";

interface WaveDetailedOutcomesProps {
  readonly wave: ApiWave;
}

export const WaveDetailedOutcomes: FC<WaveDetailedOutcomesProps> = ({
  wave,
}) => {
  return (
    <div className="tw-p-4">
      <h2 className="tw-text-iron-50 tw-text-lg tw-font-semibold tw-mb-4">
        Outcome
      </h2>
      <div className="tw-space-y-4">
        {wave.outcomes.map((outcome, i) => (
          <WaveDetailedOutcome
            key={`wave-detailed-outcome-${i}`}
            outcome={outcome}
          />
        ))}
      </div>
    </div>
  );
};
