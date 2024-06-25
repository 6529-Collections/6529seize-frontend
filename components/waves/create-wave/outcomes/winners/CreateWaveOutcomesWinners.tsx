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
  setWinnersConfig,
}: {
  readonly winnersConfig: CreateWaveOutcomeConfigWinnersConfig;
  readonly setWinnersConfig: (
    winnersConfig: CreateWaveOutcomeConfigWinnersConfig
  ) => void;
}) {
  const onCreditType = (
    creditType: CreateWaveOutcomeConfigWinnersCreditValueType
  ) => {
    setWinnersConfig({ ...winnersConfig, creditValueType: creditType });
  };

  const setWinners = (winners: CreateWaveOutcomeConfigWinner[]) => {
    setWinnersConfig({ ...winnersConfig, winners });
  };

  const addWinner = () => {
    setWinnersConfig({
      ...winnersConfig,
      winners: [...winnersConfig.winners, { value: 0 }],
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <CreateWaveOutcomesWinnersCreditTypes
        activeCreditType={winnersConfig.creditValueType}
        setActiveCreditType={onCreditType}
      />
      <div className="tw-flex tw-flex-col tw-gap-y-2">
        <div className="tw-relative">
          <input
            type="number"
            autoComplete="off"
            className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            placeholder=" "
          />
          <label
            className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
           peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            Amount
          </label>
        </div>
        <CreateWaveOutcomesWinnersRows
          winners={winnersConfig.winners}
          setWinners={setWinners}
        />
        <CreateWaveOutcomesWinnersAddWinner addWinner={addWinner} />
      </div>
    </div>
  );
}
