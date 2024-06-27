import { useEffect, useState } from "react";
import { WaveType } from "../../../../generated/models/WaveType";
import { CreateWaveStep } from "../../../../types/waves.types";

export enum CreateWaveNextStepType {
  NEXT = "NEXT",
  SAVE = "SAVE",
}

export default function CreateWaveNextStep({
  disabled,
  step,
  onClick,
}: {
  readonly disabled: boolean;
  readonly step: CreateWaveStep;
  readonly onClick: () => void;
}) {
  const getStepType = () => {
    if (step === CreateWaveStep.DESCRIPTION) return CreateWaveNextStepType.SAVE;
    return CreateWaveNextStepType.NEXT;
  };

  const [stepType, setStepType] = useState<CreateWaveNextStepType>(
    getStepType()
  );

  useEffect(() => setStepType(getStepType()), [step]);

  const components: Record<CreateWaveNextStepType, React.ReactNode> = {
    [CreateWaveNextStepType.NEXT]: (
      <button
        onClick={onClick}
        type="button"
        disabled={disabled}
        className={`${
          disabled
            ? "tw-bg-iron-800 tw-text-iron-600 tw-border-iron-800"
            : "tw-bg-primary-500 tw-border-primary-500 tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
        } tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-6 tw-py-3 tw-text-base tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
      >
        <span>Next</span>
      </button>
    ),
    [CreateWaveNextStepType.SAVE]: (
      <button
        onClick={onClick}
        className={`${
          disabled ? "" : ""
        } tw-relative tw-inline-flex tw-items-center tw-gap-x-2 tw-justify-center tw-px-6 tw-py-3 tw-border-0 tw-text-base tw-font-semibold tw-rounded-lg tw-text-white tw-bg-gradient-to-r tw-from-blue-500 tw-via-blue-600 tw-to-blue-700 hover:tw-bg-gradient-to-br tw-transform hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-in-out tw-shadow-lg`}
      >
        <span>Complete</span>
      </button>
    ),
  };

  return components[stepType];
}
