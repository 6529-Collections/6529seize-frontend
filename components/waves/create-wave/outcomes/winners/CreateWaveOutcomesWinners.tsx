import { useEffect, useState } from "react";
import {
  CreateWaveOutcomeConfigWinner,
  CreateWaveOutcomeConfigWinnersConfig,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "../../../../../types/waves.types";
import CreateWaveOutcomesWinnersAddWinner from "./CreateWaveOutcomesWinnersAddWinner";
import CreateWaveOutcomesWinnersCreditTypes from "./CreateWaveOutcomesWinnersCreditTypes";
import CreateWaveOutcomesWinnersRows from "./CreateWaveOutcomesWinnersRows";

export default function CreateWaveOutcomesWinners({
  winnersConfig,
  totalValueError,
  setWinnersConfig,
}: {
  readonly winnersConfig: CreateWaveOutcomeConfigWinnersConfig;
  readonly totalValueError: boolean;
  readonly setWinnersConfig: (
    winnersConfig: CreateWaveOutcomeConfigWinnersConfig
  ) => void;
}) {
  const onCreditType = (
    creditType: CreateWaveOutcomeConfigWinnersCreditValueType
  ) => {
    setWinnersConfig({ ...winnersConfig, creditValueType: creditType });
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

  const getTotalWinnersValue = (): number =>
    winnersConfig.winners.reduce((acc, winner) => acc + winner.value, 0);

  const getPercentageError = (): string | null => {
    if (!isPercentageCredit) return null;
    const total = getTotalWinnersValue();
    if (total !== 100)
      return `Total percentage must be 100% (currently ${total}%)`;
    return null;
  };
  const [percentageError, setPercentageError] = useState<string | null>(
    getPercentageError()
  );
  useEffect(() => {
    setPercentageError(getPercentageError());
  }, [winnersConfig.winners, winnersConfig.creditValueType]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-inline-flex tw-items-center tw-space-x-8">
        <CreateWaveOutcomesWinnersCreditTypes
          activeCreditType={winnersConfig.creditValueType}
          setActiveCreditType={onCreditType}
        />
        {percentageError && (
          <div className="tw-text-sm tw-font-medium tw-text-error">
            {percentageError}
          </div>
        )}
      </div>

      <div className="tw-flex tw-items-start tw-gap-x-3">
        {isPercentageCredit && (
          <div className="tw-relative">
            <input
              type="number"
              value={winnersConfig.totalAmount}
              onChange={onTotalAmountChange}
              autoComplete="off"
              className={`${
                totalValueError
                  ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error tw-text-error"
                  : "tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400 tw-text-white"
              } tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none  tw-border-iron-600  tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset  placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset  tw-transition tw-duration-300 tw-ease-out`}
              placeholder=" "
            />
            <label
              className={`${
                totalValueError
                  ? "peer-focus:tw-text-error tw-text-error"
                  : "peer-focus:tw-text-primary-400 tw-text-iron-500"
              } tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 
           peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
            >
              Total Amount
            </label>
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <CreateWaveOutcomesWinnersRows
            creditValueType={winnersConfig.creditValueType}
            winners={winnersConfig.winners}
            totalValueError={totalValueError}
            setWinners={setWinners}
          />
          <CreateWaveOutcomesWinnersAddWinner addWinner={addWinner} />
        </div>
      </div>
    </div>
  );
}
