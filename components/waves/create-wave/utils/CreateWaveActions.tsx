import { useEffect, useState } from "react";
import {
  getCreateWaveNextStep,
  getCreateWavePreviousStep,
  getIsNextStepDisabled,
} from "../../../../helpers/waves/create-wave.helpers";
import {
  CreateWaveConfig,
  CreateWaveStep,
} from "../../../../types/waves.types";
import CreateWaveBackStep from "./CreateWaveBackStep";
import CreateWaveNextStep from "./CreateWaveNextStep";

export default function CreateWaveActions({
  config,
  step,
  setStep,
}: {
  readonly config: CreateWaveConfig;
  readonly step: CreateWaveStep;
  readonly setStep: (step: CreateWaveStep) => void;
}) {
  const onComplete = async (): Promise<void> => {};

  const onNextStep = async (): Promise<void> => {
    const nextStep = getCreateWaveNextStep({
      step,
      waveType: config.overview.type,
    });
    if (nextStep) {
      setStep(nextStep);
      return;
    }
    await onComplete();
  };

  const [isNextStepDisabled, setIsNextStepDisabled] = useState(
    getIsNextStepDisabled({ step, config })
  );

  useEffect(
    () => setIsNextStepDisabled(getIsNextStepDisabled({ step, config })),
    [step, config]
  );

  const [previousStep, setPreviousStep] = useState<CreateWaveStep | null>(
    getCreateWavePreviousStep({ step })
  );

  useEffect(() => setPreviousStep(getCreateWavePreviousStep({ step })), [step]);

  return (
    <div className="tw-mt-6 tw-flex tw-gap-x-4 tw-items-center tw-justify-between">
      <div className="-tw-ml-6">
        {previousStep && (
          <CreateWaveBackStep onPreviousStep={() => setStep(previousStep)} />
        )}
      </div>
      <div className="tw-ml-auto">
        <CreateWaveNextStep
          onClick={onNextStep}
          disabled={isNextStepDisabled}
          step={step}
          waveType={config.overview.type}
        />
      </div>
    </div>
  );
}
