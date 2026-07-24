"use client";

import { CreateWaveStep } from "@/types/waves.types";
import Button from "@/components/utils/button/Button";

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
  const isCompleteStep = step === CreateWaveStep.DESCRIPTION;

  return (
    <Button
      variant="primary"
      size="md"
      onClick={onClick}
      disabled={isCompleteStep ? submitting : disabled}
      loading={isCompleteStep && submitting}
    >
      {isCompleteStep ? "Complete" : "Next"}
    </Button>
  );
}
