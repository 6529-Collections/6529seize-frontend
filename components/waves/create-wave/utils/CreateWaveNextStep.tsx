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
  quickChat = false,
}: {
  readonly disabled: boolean;
  readonly step: CreateWaveStep;
  readonly submitting: boolean;
  readonly onClick: () => void;
  readonly quickChat?: boolean;
}) {
  const locale = useBrowserLocale();
  const isCompleteStep = step === CreateWaveStep.REVIEW;
  const forwardLabel = quickChat
    ? "waves.create.quick.review"
    : "waves.create.actions.next";

  return (
    <Button
      variant="primary"
      size="md"
      onClick={onClick}
      disabled={disabled || submitting}
      loading={submitting}
    >
      {t(locale, isCompleteStep ? "waves.create.review.submit" : forwardLabel)}
    </Button>
  );
}
