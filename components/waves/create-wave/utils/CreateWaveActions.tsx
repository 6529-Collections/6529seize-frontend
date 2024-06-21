import { useEffect, useState } from "react";
import {
  CREATE_WAVE_VALIDATION_ERROR,
  getCreateWaveNextStep,
  getCreateWavePreviousStep,
  getCreateWaveValidationErrors,
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

  const [previousStep, setPreviousStep] = useState<CreateWaveStep | null>(
    getCreateWavePreviousStep({ step, waveType: config.overview.type })
  );

  useEffect(
    () =>
      setPreviousStep(
        getCreateWavePreviousStep({ step, waveType: config.overview.type })
      ),
    [step, config.overview.type]
  );

  const [errors, setErrors] = useState<CREATE_WAVE_VALIDATION_ERROR[]>(
    getCreateWaveValidationErrors({ config, step })
  );

  useEffect(
    () => setErrors(getCreateWaveValidationErrors({ config, step })),
    [config, step]
  );

  return (
    <div className="tw-mt-6 tw-flex tw-gap-x-4 tw-items-center tw-justify-between">
      {errors.map((error) => (
        <div key={error}>{error}</div>
      ))}
      <div className="-tw-ml-6">
        {previousStep && (
          <CreateWaveBackStep onPreviousStep={() => setStep(previousStep)} />
        )}
      </div>
      <div className="tw-ml-auto">
        <CreateWaveNextStep onClick={onNextStep} disabled={false} step={step} />
      </div>
    </div>
  );
}
