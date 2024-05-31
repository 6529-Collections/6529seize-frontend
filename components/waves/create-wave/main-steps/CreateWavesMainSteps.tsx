import {
  CREATE_WAVE_MAIN_STEPS,
  CREATE_WAVE_STEPS_LABELS,
} from "../../../../helpers/waves/waves.constants";
import { CreateWaveStep, WaveType } from "../../../../types/waves.types";
import CreateWavesMainStep from "./CreateWavesMainStep";

export default function CreateWavesMainSteps({
  waveType,
  activeStep,
  onStep,
}: {
  readonly waveType: WaveType;
  readonly activeStep: CreateWaveStep;
  readonly onStep: (step: CreateWaveStep) => void;
}) {
  const steps = CREATE_WAVE_MAIN_STEPS[waveType];
  const activeStepIndex = steps.indexOf(activeStep);
  return (
    <div className="tw-hidden lg:tw-block tw-pr-24 tw-border-r tw-border-solid tw-border-iron-700 tw-border-y-0 tw-border-b-0 tw-border-l-0">
      <nav aria-label="Progress">
        <div className="tw-flex tw-flex-col">
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
