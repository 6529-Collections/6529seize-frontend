import { getCreateWaveStepStatus } from "@/helpers/waves/waves.helpers";
import type { CreateWaveStep } from "@/types/waves.types";
import { CreateWaveStepStatus } from "@/types/waves.types";
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
    <div className="tw-relative tw-mb-10">
      {!isLast && <CreateWavesMainStepConnectionLine done={isDone} />}
      <button
        type="button"
        disabled={!isDone}
        onClick={() => onStep(step)}
        className="tw-group tw-relative tw-flex tw-items-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none"
      >
        <span className="tw-mr-5 tw-flex tw-min-w-0 tw-flex-col">
          <span
            className={`${LABEL_CLASSES[stepStatus]} tw-transform tw-text-base tw-transition tw-duration-300 tw-ease-out`}
          >
            {label}
          </span>
        </span>
        <span className="tw-flex tw-h-8 tw-items-center">
          <CreateWavesMainStepIcon stepStatus={stepStatus} />
        </span>
      </button>
    </div>
  );
}
