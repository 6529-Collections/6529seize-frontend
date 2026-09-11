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
  nextDisabled = false,
  setStep,
  onComplete,
}: {
  readonly config: CreateWaveConfig;
  readonly step: CreateWaveStep;
  readonly submitting: boolean;
  readonly nextDisabled?: boolean | undefined;
  readonly setStep: (
    step: CreateWaveStep,
    direction: "forward" | "backward"
  ) => Promise<void>;
  readonly onComplete: () => Promise<void>;
}) {
  const ongoingRanking = config.dates?.ongoingRanking ?? false;

  const onNextStep = (): void => {
    if (nextDisabled) {
      return;
    }
    const nextStep = getCreateWaveNextStep({
      step,
      waveType: config.overview.type,
      ongoingRanking,
    });
    if (nextStep !== null) {
      void setStep(nextStep, "forward");
      return;
    }
    void onComplete();
  };

  const previousStep = getCreateWavePreviousStep({
    step,
    waveType: config.overview.type,
    ongoingRanking,
  });

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
      <div>
        {previousStep !== null && (
          <CreateWaveBackStep
            disabled={submitting}
            onPreviousStep={() => {
              void setStep(previousStep, "backward");
            }}
          />
        )}
      </div>
      <div className="tw-ml-auto">
        <CreateWaveNextStep
          onClick={onNextStep}
          disabled={nextDisabled}
          step={step}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
