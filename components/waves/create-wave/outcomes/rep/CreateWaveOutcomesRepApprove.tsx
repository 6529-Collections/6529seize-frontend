"use client";

import { useState } from "react";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import { CreateWaveOutcomeType } from "@/types/waves.types";
import Button from "@/components/utils/button/Button";
import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveOutcomesRepCategoryField from "./CreateWaveOutcomesRepCategoryField";
import {
  CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES,
  CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES,
  getCreateWaveOutcomeInputStateClasses,
  getCreateWaveOutcomeLabelStateClasses,
} from "../createWaveOutcomeStyles";

export default function CreateWaveOutcomesRepApprove({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const outcomeType = CreateWaveOutcomeType.REP;
  const [outcome, setOutcome] = useState<CreateWaveOutcomeConfig>({
    type: outcomeType,
    title: null,
    credit: null,
    category: null,
    winnersConfig: null,
  });

  const locale = useBrowserLocale();
  const [showCategoryRequired, setShowCategoryRequired] =
    useState<boolean>(false);
  const [creditError, setCreditError] = useState<boolean>(false);
  const creditErrorId = "outcome-rep-credit-error";

  // Same category rules the rep-assignment flow enforces (mirrors the
  // backend); named live so an invalid category never survives to submit.
  const categoryViolation = outcome.category
    ? getRepCategoryViolation(outcome.category)
    : null;
  let categoryErrorMessage: string | null = null;
  if (categoryViolation) {
    categoryErrorMessage = t(locale, categoryViolation.key, {
      ...categoryViolation.params,
    });
  } else if (showCategoryRequired) {
    categoryErrorMessage = t(locale, "rep.categories.validation.required");
  }

  const setCategory = (category: string | null) => {
    setShowCategoryRequired(false);
    setOutcome({ ...outcome, category });
  };

  const setCredit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCredit = parseFloat(e.target.value);
    const isValid = Number.isFinite(newCredit) && newCredit >= 0;
    setOutcome({ ...outcome, credit: isValid ? newCredit : null });
    setCreditError(false);
  };

  const onSubmit = () => {
    const dontHaveCategorySet = !outcome.category;
    const dontHaveCreditSet =
      outcome.credit === null ||
      !Number.isFinite(outcome.credit) ||
      outcome.credit <= 0;
    setShowCategoryRequired(dontHaveCategorySet);
    setCreditError(dontHaveCreditSet);

    if (
      dontHaveCategorySet ||
      categoryViolation !== null ||
      dontHaveCreditSet
    ) {
      return;
    }
    onOutcome(outcome);
  };

  return (
    <div className="tw-col-span-full">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-pt-[0.5px] sm:tw-flex-row">
          <CreateWaveOutcomesRepCategoryField
            category={outcome.category}
            errorMessage={categoryErrorMessage}
            setCategory={setCategory}
          />
        </div>

        <div className="tw-grid tw-gap-x-5">
          <div>
            <div className="tw-group tw-relative tw-w-full">
              <input
                type="text"
                inputMode="decimal"
                value={outcome.credit !== null ? outcome.credit.toString() : ""}
                onChange={setCredit}
                id="outcome-rep-credit"
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
                htmlFor="outcome-rep-credit"
                className={`${getCreateWaveOutcomeLabelStateClasses(
                  creditError
                )} ${CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES}`}
              >
                Rep
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
                  {t(locale, "waves.create.outcomes.repPositiveError")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="tw-flex tw-justify-end tw-gap-x-3">
          <Button variant="secondary" size="md" onClick={onCancel}>
            {t(locale, "waves.create.actions.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={onSubmit}>
            {t(locale, "waves.create.actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
