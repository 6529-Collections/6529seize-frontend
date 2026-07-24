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
import CreateWaveOutcomesWinners from "../winners/CreateWaveOutcomesWinners";
import CreateWaveOutcomeFormActions from "../CreateWaveOutcomeFormActions";
import { isMissingOutcomeAmount } from "../outcomeValidation";

export default function CreateWaveOutcomesCICRank({
  onOutcome,
  onCancel,
}: {
  readonly onOutcome: (outcome: CreateWaveOutcomeConfig) => void;
  readonly onCancel: () => void;
}) {
  const outcomeType = CreateWaveOutcomeType.NIC;
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

  const [totalValueError, setTotalValueError] = useState<boolean>(false);
  const [percentageError, setPercentageError] = useState<boolean>(false);

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
    const nextTotalValueError = getTotalValueError();
    const nextPercentageError = getPercentageError();
    setTotalValueError(nextTotalValueError);
    setPercentageError(nextPercentageError);
    if (nextTotalValueError || nextPercentageError) {
      return;
    }
    onOutcome(outcome);
  };
  return (
    <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        {outcome.winnersConfig && (
          <CreateWaveOutcomesWinners
            winnersConfig={outcome.winnersConfig}
            outcomeType={outcomeType}
            totalValueError={totalValueError}
            percentageError={percentageError}
            setWinnersConfig={setWinnersConfig}
          />
        )}
        <CreateWaveOutcomeFormActions onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
