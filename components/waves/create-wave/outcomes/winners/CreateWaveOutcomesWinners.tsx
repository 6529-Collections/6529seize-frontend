"use client";

import { useEffect } from "react";
import type {
  CreateWaveOutcomeConfigWinner,
  CreateWaveOutcomeConfigWinnersConfig,
} from "@/types/waves.types";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";
import CreateWaveOutcomesWinnersAddWinner from "./CreateWaveOutcomesWinnersAddWinner";
import CreateWaveOutcomesWinnersRows from "./CreateWaveOutcomesWinnersRows";
import {
  CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES,
  CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES,
  getCreateWaveOutcomeInputStateClasses,
  getCreateWaveOutcomeLabelStateClasses,
} from "../createWaveOutcomeStyles";

export default function CreateWaveOutcomesWinners({
  winnersConfig,
  totalValueError,
  percentageError,
  outcomeType,
  setWinnersConfig,
}: {
  readonly winnersConfig: CreateWaveOutcomeConfigWinnersConfig;
  readonly totalValueError: boolean;
  readonly percentageError: boolean;
  readonly outcomeType: CreateWaveOutcomeType;
  readonly setWinnersConfig: (
    winnersConfig: CreateWaveOutcomeConfigWinnersConfig
  ) => void;
}) {
  const OUTCOME_TYPE_LABELS: Record<CreateWaveOutcomeType, string> = {
    [CreateWaveOutcomeType.MANUAL]: "Manual",
    [CreateWaveOutcomeType.REP]: "Rep",
    [CreateWaveOutcomeType.NIC]: "NIC",
  };

  const onTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setWinnersConfig({ ...winnersConfig, totalAmount: value });
    } else {
      setWinnersConfig({ ...winnersConfig, totalAmount: 0 });
    }
  };

  const getTotal = (): number => {
    if (
      winnersConfig.creditValueType ===
      CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE
    ) {
      return winnersConfig.totalAmount;
    }
    return winnersConfig.winners.reduce((acc, winner) => acc + winner.value, 0);
  };

  useEffect(() => {
    setWinnersConfig({
      ...winnersConfig,
      totalAmount: getTotal(),
    });
  }, [winnersConfig.winners, winnersConfig.creditValueType]);

  const setWinners = (winners: CreateWaveOutcomeConfigWinner[]) => {
    setWinnersConfig({ ...winnersConfig, winners });
  };

  const addWinner = () => {
    setWinnersConfig({
      ...winnersConfig,
      winners: [...winnersConfig.winners, { value: 0 }],
    });
  };

  const isPercentageCredit =
    winnersConfig.creditValueType ===
    CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE;

  const isWinnersRowsError = isPercentageCredit
    ? percentageError
    : totalValueError;
  const totalAmountErrorId = "outcome-total-amount-error";

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {/* <div className="tw-inline-flex tw-items-center tw-space-x-8">
        <CreateWaveOutcomesWinnersCreditTypes
          activeCreditType={winnersConfig.creditValueType}
          setActiveCreditType={onCreditType}
        />
      </div> */}
      {totalValueError && (
        <div
          id={totalAmountErrorId}
          role="alert"
          className="tw-flex tw-items-center tw-gap-x-2"
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
            Total amount must be higher than 0
          </div>
        </div>
      )}
      {percentageError && (
        <div className="tw-flex tw-items-center tw-gap-x-2">
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
          <div className="tw-relative tw-z-10 tw-text-xs tw-font-medium tw-text-error">
            Total percentage must be 100%
          </div>
        </div>
      )}
      <div className="tw-flex tw-items-start tw-gap-x-3">
        {isPercentageCredit && (
          <div>
            <div className="tw-relative">
              <input
                id="outcome-total-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={winnersConfig.totalAmount}
                onChange={onTotalAmountChange}
                autoComplete="off"
                aria-invalid={totalValueError}
                aria-describedby={
                  totalValueError ? totalAmountErrorId : undefined
                }
                className={`${getCreateWaveOutcomeInputStateClasses({
                  hasError: totalValueError,
                  hasValue: winnersConfig.totalAmount > 0,
                })} ${CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES} tw-pr-16`}
                placeholder=" "
              />
              <label
                htmlFor="outcome-total-amount"
                className={`${getCreateWaveOutcomeLabelStateClasses(
                  totalValueError
                )} ${CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES}`}
              >
                Total Amount
              </label>
              <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                <span className="tw-text-sm tw-font-normal tw-text-iron-500">
                  {OUTCOME_TYPE_LABELS[outcomeType]}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <CreateWaveOutcomesWinnersRows
            creditValueType={winnersConfig.creditValueType}
            winners={winnersConfig.winners}
            isError={isWinnersRowsError}
            outcomeType={outcomeType}
            setWinners={setWinners}
          />
          <CreateWaveOutcomesWinnersAddWinner addWinner={addWinner} />
        </div>
      </div>
    </div>
  );
}
