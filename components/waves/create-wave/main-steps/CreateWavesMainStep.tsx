import { getCreateWaveStepStatus } from "../../../../helpers/waves/waves.helpers";
import {
  CreateWaveStep,
  CreateWaveStepStatus,
} from "../../../../types/waves.types";
import CreateWavesMainStepIcon from "./CreateWavesMainStepIcon";

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
  return (
    <div className="tw-relative tw-mb-11">
      {!isLast && (
        <div
          className={`${
            isDone ? "tw-bg-primary-500" : "tw-bg-iron-700"
          } tw-absolute tw-left-3 tw-top-10 tw-h-full tw-rounded-sm tw-w-0.5`}
          aria-hidden="true"
        ></div>
      )}
      <button
        type="button"
        onClick={() => onStep(step)}
        className="tw-bg-transparent tw-p-0 tw-border-none focus:tw-outline-none tw-group tw-relative tw-flex tw-items-center"
      >
        <span className="tw-flex tw-h-9 tw-items-center">
          <CreateWavesMainStepIcon stepStatus={stepStatus} />
        </span>
        <span className="tw-ml-4 tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-text-base tw-font-semibold tw-text-iron-600">
            {label}
          </span>
        </span>
      </button>
    </div>
  );
}
