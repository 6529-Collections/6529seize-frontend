import { useEffect, useState } from "react";
import { CreateWaveStep } from "../../../../types/waves.types";
import PrimaryButton from "../../../utils/button/PrimaryButton";

export enum CreateWaveNextStepType {
  NEXT = "NEXT",
  SAVE = "SAVE",
}

export default function CreateWaveNextStep({
  disabled,
  step,
  submitting,
  onClick,
}: {
  readonly disabled: boolean;
  readonly step: CreateWaveStep;
  readonly submitting: boolean;
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
      <PrimaryButton
        onClicked={onClick}
        disabled={disabled}
        loading={false}
        padding="tw-px-6 tw-py-3"
      >
        Next
      </PrimaryButton>
    ),
    [CreateWaveNextStepType.SAVE]: (
      <PrimaryButton
        onClicked={onClick}
        disabled={submitting}
        loading={submitting}
        padding="tw-px-6 tw-py-3"
      >
        Complete
      </PrimaryButton>
    ),
  };

  return components[stepType];
}
