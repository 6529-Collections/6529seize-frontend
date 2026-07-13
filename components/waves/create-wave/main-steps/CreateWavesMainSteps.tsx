import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  CREATE_WAVE_STEPS_LABELS,
  getCreateWaveMainSteps,
} from "@/helpers/waves/waves.constants";
import type { CreateWaveStep } from "@/types/waves.types";
import CreateWavesMainStep from "./CreateWavesMainStep";

export default function CreateWavesMainSteps({
  waveType,
  ongoingRanking = false,
  activeStep,
  onStep,
}: {
  readonly waveType: ApiWaveType;
  readonly ongoingRanking?: boolean;
  readonly activeStep: CreateWaveStep;
  readonly onStep: (step: CreateWaveStep) => void;
}) {
  const steps = getCreateWaveMainSteps({ waveType, ongoingRanking });
  const activeStepIndex = steps.indexOf(activeStep);
  return (
    <div className="tw-hidden tw-min-h-full tw-w-full lg:tw-block">
      <nav aria-label="Progress" className="tw-h-full">
        <div className="tw-flex tw-h-full tw-flex-col tw-items-end">
          {steps.map((step, stepIndex) => (
            <CreateWavesMainStep
              key={step}
              isLast={stepIndex === steps.length - 1}
              label={CREATE_WAVE_STEPS_LABELS[waveType][step]}
              stepIndex={stepIndex}
              activeStepIndex={activeStepIndex}
              step={step}
              onStep={onStep}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
