import { useEffect, useState } from "react";
import { WaveOverviewConfig } from "../../../../types/waves.types";

import CreateWaveOverviewInputs from "./CreateWaveOverviewInputs";

import CreateWaveSignature from "./signature/CreateWaveSignature";
import CreateWaveType from "./type/CreateWaveType";
import CreateWaveNextStep from "../utils/CreateWaveNextStep";

export default function CreateWaveOverview({
  overview,
  setOverview,
  onNextStep,
}: {
  readonly overview: WaveOverviewConfig;
  readonly setOverview: (overview: WaveOverviewConfig) => void;
  readonly onNextStep: () => void;
}) {
  const onChange = <K extends keyof WaveOverviewConfig>({
    key,
    value,
  }: {
    readonly key: K;
    readonly value: WaveOverviewConfig[K];
  }) =>
    setOverview({
      ...overview,
      [key]: value,
    });

  const getIsNextStepDisabled = () => {
    if (!overview.name || !overview.description) {
      return true;
    }

    if (!overview.type || !overview.signatureType) {
      return true;
    }

    return false;
  };

  const [isNextStepDisabled, setIsNextStepDisabled] = useState(
    getIsNextStepDisabled()
  );

  useEffect(() => setIsNextStepDisabled(getIsNextStepDisabled()), [overview]);

  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-flex tw-flex-col tw-space-y-8">
        <CreateWaveOverviewInputs onChange={onChange} />
        <CreateWaveType
          selected={overview.type}
          onChange={(type) =>
            onChange({
              key: "type",
              value: type,
            })
          }
        />
        <CreateWaveSignature
          selectedWaveType={overview.type}
          selectedSignatureType={overview.signatureType}
          onChange={(type) => onChange({ key: "signatureType", value: type })}
        />
        <div className="tw-text-right">
          <CreateWaveNextStep
            disabled={isNextStepDisabled}
            onClick={onNextStep}
          />
        </div>
      </div>
    </div>
  );
}
