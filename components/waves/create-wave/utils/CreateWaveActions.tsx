"use client";

import {
  getCreateWaveNextStep,
  getCreateWavePreviousStep,
} from "@/helpers/waves/create-wave.helpers";
import type { CreateWaveConfig, CreateWaveStep } from "@/types/waves.types";
import CreateWaveBackStep from "./CreateWaveBackStep";
import CreateWaveNextStep from "./CreateWaveNextStep";

export default function CreateWaveActions({
  config,
  step,
  submitting,
  setStep,
  onComplete,
}: {
  readonly config: CreateWaveConfig;
  readonly step: CreateWaveStep;
  readonly submitting: boolean;
  readonly setStep: (
    step: CreateWaveStep,
    direction: "forward" | "backward"
  ) => void;
  readonly onComplete: () => Promise<void>;
}) {
  const onNextStep = async (): Promise<void> => {
    const nextStep = getCreateWaveNextStep({
      step,
      waveType: config.overview.type,
    });
    if (nextStep !== null) {
      setStep(nextStep, "forward");
      return;
    }
    await onComplete();
  };

  const previousStep = getCreateWavePreviousStep({
    step,
    waveType: config.overview.type,
  });

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
      <div className="-tw-ml-6">
        {previousStep !== null && (
          <CreateWaveBackStep
            onPreviousStep={() => setStep(previousStep, "backward")}
          />
        )}
      </div>
      <div className="tw-ml-auto">
        <CreateWaveNextStep
          onClick={onNextStep}
          disabled={false}
          step={step}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
