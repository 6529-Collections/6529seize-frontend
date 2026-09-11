"use client";

import { useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import Button from "@/components/utils/button/Button";
import {
  CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES,
  CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES,
  getCreateWaveOutcomeInputStateClasses,
  getCreateWaveOutcomeLabelStateClasses,
} from "../createWaveOutcomeStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveOutcomesCICApprove({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const outcomeType = CreateWaveOutcomeType.NIC;
  const locale = useBrowserLocale();
  const [outcome, setOutcome] = useState<CreateWaveOutcomeConfig>({
    type: outcomeType,
    title: null,
    credit: null,
    category: null,
    winnersConfig: null,
  });

  const [creditError, setCreditError] = useState<boolean>(false);
  const creditErrorId = "outcome-cic-credit-error";

  const setCredit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCredit = parseFloat(e.target.value);
    const isValid = Number.isFinite(newCredit) && newCredit >= 0;
    setOutcome({ ...outcome, credit: isValid ? newCredit : null });
    setCreditError(false);
  };

  const onSubmit = () => {
    const isMissingOutcomeAmount =
      outcome.credit === null ||
      !Number.isFinite(outcome.credit) ||
      outcome.credit <= 0;
    setCreditError(isMissingOutcomeAmount);

    if (isMissingOutcomeAmount) {
      return;
    }
    onOutcome(outcome);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-grid tw-gap-x-5 tw-pt-[0.5px]">
        <div>
          <div className="tw-group tw-relative tw-w-full">
            <input
              type="text"
              inputMode="decimal"
              value={outcome.credit !== null ? outcome.credit.toString() : ""}
              onChange={setCredit}
              id="outcome-cic-credit"
              autoComplete="off"
              aria-invalid={creditError}
              aria-describedby={creditError ? creditErrorId : undefined}
              className={`${getCreateWaveOutcomeInputStateClasses({
                hasError: creditError,
                hasValue: outcome.credit !== null,
              })} ${CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES}`}
              placeholder=" "
            />
            <label
              htmlFor="outcome-cic-credit"
              className={`${getCreateWaveOutcomeLabelStateClasses(
                creditError
              )} ${CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES}`}
            >
              NIC
            </label>
          </div>
          {creditError && (
            <div
              id={creditErrorId}
              role="alert"
              className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
            >
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="tw-text-xs tw-font-medium tw-text-error">
                {t(locale, "waves.create.outcomes.nicPositiveError")}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="tw-flex tw-justify-end tw-gap-x-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={onSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
}
