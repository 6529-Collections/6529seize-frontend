"use client";

import { CreateWaveStep } from "@/types/waves.types";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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
  const locale = useBrowserLocale();
  const isCompleteStep = step === CreateWaveStep.DESCRIPTION;

  return (
    <Button
      variant="primary"
      size="md"
      onClick={onClick}
      disabled={disabled || submitting}
      loading={submitting}
    >
      {t(
        locale,
        isCompleteStep
          ? "waves.create.actions.complete"
          : "waves.create.actions.next"
      )}
    </Button>
  );
}
