import { getCreateWaveStepStatus } from "@/helpers/waves/waves.helpers";
import type {
  CreateWaveStep} from "@/types/waves.types";
import {
  CreateWaveStepStatus,
} from "@/types/waves.types";
import CreateWavesMainStepIcon from "./CreateWavesMainStepIcon";
import CreateWavesMainStepConnectionLine from "./CreateWavesMainStepConnectionLine";

export default function CreateWavesMainStep({
  isLast,
  label,
  step,
  stepIndex,
  activeStepIndex,
  onStep,
}: {
  readonly isLast: boolean;
  readonly label: string;
  readonly step: CreateWaveStep;
  readonly stepIndex: number;
  readonly activeStepIndex: number;
  readonly onStep: (step: CreateWaveStep) => void;
}) {
  const stepStatus = getCreateWaveStepStatus({
    stepIndex,
    activeStepIndex,
  });
  const isDone = stepStatus === CreateWaveStepStatus.DONE;

  const LABEL_CLASSES: Record<CreateWaveStepStatus, string> = {
    [CreateWaveStepStatus.DONE]: "tw-text-iron-600 tw-font-semibold tw-delay-0",
    [CreateWaveStepStatus.ACTIVE]:
      "tw-text-primary-400 tw-font-bold tw-delay-500",
    [CreateWaveStepStatus.PENDING]:
      "tw-text-iron-600 tw-font-semibold tw-delay-0",
  };

  return (
    <div className="tw-relative tw-mb-11">
      {!isLast && <CreateWavesMainStepConnectionLine done={isDone} />}
      <button
        type="button"
        disabled={!isDone}
        onClick={() => onStep(step)}
        className="tw-bg-transparent tw-p-0 tw-border-none focus:tw-outline-none tw-group tw-relative tw-flex tw-items-center"
      >
        <span className="tw-mr-6 tw-flex tw-min-w-0 tw-flex-col">
          <span
            className={`${LABEL_CLASSES[stepStatus]} tw-text-base tw-transform tw-transition tw-ease-out tw-duration-300`}
          >
            {label}
          </span>
        </span>
        <span className="tw-flex tw-h-9 tw-items-center">
          <CreateWavesMainStepIcon stepStatus={stepStatus} />
        </span>
      </button>
    </div>
  );
}
