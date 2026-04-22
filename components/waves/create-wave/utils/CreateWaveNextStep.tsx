"use client";

import { CreateWaveStep } from "@/types/waves.types";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

enum CreateWaveNextStepType {
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
  const stepType =
    step === CreateWaveStep.DESCRIPTION
      ? CreateWaveNextStepType.SAVE
      : CreateWaveNextStepType.NEXT;

  const components: Record<CreateWaveNextStepType, React.ReactNode> = {
    [CreateWaveNextStepType.NEXT]: (
      <PrimaryButton
        onClicked={onClick}
        disabled={disabled}
        loading={false}
        padding="tw-px-4 tw-py-2.5"
      >
        Next
      </PrimaryButton>
    ),
    [CreateWaveNextStepType.SAVE]: (
      <PrimaryButton
        onClicked={onClick}
        disabled={submitting}
        loading={submitting}
        padding="tw-px-4 tw-py-2.5"
      >
        Complete
      </PrimaryButton>
    ),
  };

  return components[stepType];
}
