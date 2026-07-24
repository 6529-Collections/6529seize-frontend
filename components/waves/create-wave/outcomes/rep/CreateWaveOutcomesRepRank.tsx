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
import RepCategorySearch from "@/components/utils/input/rep-category/RepCategorySearch";
import CreateWaveOutcomesWinners from "../winners/CreateWaveOutcomesWinners";
import CreateWaveOutcomeFormActions from "../CreateWaveOutcomeFormActions";
import { isMissingOutcomeAmount } from "../outcomeValidation";

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

  const [categoryError, setCategoryError] = useState<boolean>(false);
  const [totalValueError, setTotalValueError] = useState<boolean>(false);
  const [percentageError, setPercentageError] = useState<boolean>(false);

  const setCategory = (category: string | null) => {
    setCategoryError(false);
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
    const winnersConfig = outcome.winnersConfig;
    if (
      winnersConfig?.creditValueType ===
      CreateWaveOutcomeConfigWinnersCreditValueType.ABSOLUTE_VALUE
    ) {
      const totalValue = getWinnersTotal();

      if (isMissingOutcomeAmount(totalValue)) {
        return true;
      }
      if (totalValue !== winnersConfig.totalAmount) {
        return true;
      }
    } else {
      return isMissingOutcomeAmount(winnersConfig?.totalAmount);
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
    const nextTotalValueError = getTotalValueError();
    const nextPercentageError = getPercentageError();
    setCategoryError(dontHaveCategorySet);
    setTotalValueError(nextTotalValueError);
    setPercentageError(nextPercentageError);
    if (dontHaveCategorySet || nextTotalValueError || nextPercentageError) {
      return;
    }
    onOutcome(outcome);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-5">
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-5 tw-pt-[0.5px] sm:tw-flex-row">
        <RepCategorySearch
          error={categoryError}
          category={outcome.category}
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
      <CreateWaveOutcomeFormActions onCancel={onCancel} onSubmit={onSubmit} />
    </div>
  );
}
