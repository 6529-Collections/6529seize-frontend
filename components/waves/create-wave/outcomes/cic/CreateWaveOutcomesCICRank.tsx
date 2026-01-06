"use client";

import { useState } from "react";
import type {
  CreateWaveOutcomeConfig,
  CreateWaveOutcomeConfigWinnersConfig} from "@/types/waves.types";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";
import CreateWaveOutcomesWinners from "../winners/CreateWaveOutcomesWinners";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

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
    maxWinners: 1,
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
      maxWinners: winnersConfig.winners.length,
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
    const totalValueError = getTotalValueError();
    const percentageError = getPercentageError();
    setTotalValueError(totalValueError);
    setPercentageError(percentageError);
    if (totalValueError || percentageError) {
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
        <div className="tw-flex tw-justify-end tw-gap-x-3">
          <button
            onClick={onCancel}
            type="button"
            className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-relative tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
            Cancel
          </button>
          <PrimaryButton
            onClicked={onSubmit}
            disabled={false}
            loading={false}
            padding="tw-px-4 tw-py-3">
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
