"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveBackStep({
  onPreviousStep,
  disabled = false,
}: {
  readonly onPreviousStep: () => void;
  readonly disabled?: boolean;
}) {
  const locale = useBrowserLocale();

  return (
    <Button
      variant="secondary"
      size="md"
      onClick={onPreviousStep}
      disabled={disabled}
    >
      <svg
        className="tw-size-4 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 12H4M4 12L10 18M4 12L10 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span>{t(locale, "waves.create.actions.previous")}</span>
    </Button>
  );
}
