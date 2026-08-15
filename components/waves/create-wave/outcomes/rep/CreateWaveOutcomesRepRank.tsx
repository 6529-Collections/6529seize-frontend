"use client";

import { useState } from "react";
import type {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeConfigWinnersConfig,
} from "@/types/waves.types";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";
import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import CreateWaveOutcomesWinners from "../winners/CreateWaveOutcomesWinners";
import Button from "@/components/utils/button/Button";
import CreateWaveOutcomesRepCategoryField from "./CreateWaveOutcomesRepCategoryField";

export default function CreateWaveOutcomesRepRank({
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
    winnersConfig: {
      creditValueType:
        CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE,
      totalAmount: 0,
      winners: [{ value: 0 }],
    },
  });

  const locale = useBrowserLocale();
  const [showCategoryRequired, setShowCategoryRequired] =
    useState<boolean>(false);
  const [totalValueError, setTotalValueError] = useState<boolean>(false);
  const [percentageError, setPercentageError] = useState<boolean>(false);

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

  const setWinnersConfig = (
    winnersConfig: CreateWaveOutcomeConfigWinnersConfig
  ) => {
    setTotalValueError(false);
    setPercentageError(false);
    setOutcome({
      ...outcome,
      winnersConfig,
    });
  };

  const getWinnersTotal = (): number | null =>
    outcome.winnersConfig?.winners.reduce(
      (acc, winner) => acc + winner.value,
      0
    ) ?? null;

  const getTotalValueError = (): boolean => {
    if (
      outcome.winnersConfig?.creditValueType ===
      CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE
    ) {
      const totalValue = getWinnersTotal();

      if (!totalValue) {
        return true;
      }
      if (totalValue !== outcome.winnersConfig?.totalAmount) {
        return true;
      }
    } else {
      return !outcome.winnersConfig?.totalAmount;
    }

    return false;
  };

  const getPercentageError = (): boolean => {
    if (
      outcome.winnersConfig?.creditValueType !==
      CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE
    ) {
      return false;
    }
    return getWinnersTotal() !== 100;
  };

  const onSubmit = () => {
    const dontHaveCategorySet = !outcome.category;
    const totalValueError = getTotalValueError();
    const percentageError = getPercentageError();
    setShowCategoryRequired(dontHaveCategorySet);
    setTotalValueError(totalValueError);
    setPercentageError(percentageError);
    if (
      dontHaveCategorySet ||
      categoryViolation !== null ||
      totalValueError ||
      percentageError
    ) {
      return;
    }
    onOutcome(outcome);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-5 tw-pt-[0.5px] sm:tw-flex-row">
        <CreateWaveOutcomesRepCategoryField
          category={outcome.category}
          errorMessage={categoryErrorMessage}
          setCategory={setCategory}
        />
      </div>

      {outcome.winnersConfig && (
        <CreateWaveOutcomesWinners
          winnersConfig={outcome.winnersConfig}
          totalValueError={totalValueError}
          percentageError={percentageError}
          outcomeType={outcomeType}
          setWinnersConfig={setWinnersConfig}
        />
      )}
      <div className="tw-flex tw-justify-end tw-gap-x-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          {t(locale, "waves.create.actions.cancel")}
        </Button>
        <Button variant="primary" size="md" onClick={onSubmit}>
          {t(locale, "waves.create.actions.save")}
        </Button>
      </div>
    </div>
  );
}
