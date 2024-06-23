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
    <div className="tw-flex tw-gap-x-3 tw-items-start">
      <CreateWaveOutcomesWinnersCreditTypes
        activeCreditType={winnersConfig.creditValueType}
        setActiveCreditType={onCreditType}
      />
      <div className="tw-flex tw-flex-col tw-gap-y-2">
        <CreateWaveOutcomesWinnersRows
          winners={winnersConfig.winners}
          setWinners={setWinners}
        />
        <CreateWaveOutcomesWinnersAddWinner addWinner={addWinner} />
      </div>
    </div>
  );
}
