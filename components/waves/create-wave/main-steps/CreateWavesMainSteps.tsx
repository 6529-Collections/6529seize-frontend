import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import {
  CREATE_WAVE_MAIN_STEPS,
  CREATE_WAVE_STEPS_LABELS,
} from "../../../../helpers/waves/waves.constants";
import { CreateWaveStep } from "../../../../types/waves.types";
import CreateWavesMainStep from "./CreateWavesMainStep";

export default function CreateWavesMainSteps({
  waveType,
  activeStep,
  onStep,
}: {
  readonly waveType: ApiWaveType;
  readonly activeStep: CreateWaveStep;
  readonly onStep: (step: CreateWaveStep) => void;
}) {
  const steps = CREATE_WAVE_MAIN_STEPS[waveType];
  const activeStepIndex = steps.indexOf(activeStep);
  return (
    <div className="tw-hidden lg:tw-block tw-min-h-full">
      <nav aria-label="Progress">
        <div className="tw-flex tw-flex-col tw-items-end">
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
