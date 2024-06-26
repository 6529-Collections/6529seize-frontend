import {
  CreateWaveOutcomeConfigWinner,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "../../../../../types/waves.types";
import CreateWaveOutcomesWinnersRow from "./CreateWaveOutcomesWinnersRow";

export default function CreateWaveOutcomesWinnersRows({
  creditValueType,
  winners,
  totalValueError,
  setWinners,
}: {
  readonly creditValueType: CreateWaveOutcomeConfigWinnersCreditValueType;
  readonly winners: CreateWaveOutcomeConfigWinner[];
  readonly totalValueError: boolean;
  readonly setWinners: (winners: CreateWaveOutcomeConfigWinner[]) => void;
}) {
  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const onWinnerValueChange = ({
    value,
    index,
  }: {
    value: number;
    index: number;
  }) => {
    const newWinners = [...winners];
    newWinners[index] = { value };
    setWinners(newWinners);
  };

  return (
    <div className="tw-space-y-3">
      {winners.map((winner, i) => (
        <CreateWaveOutcomesWinnersRow
          key={i}
          i={i}
          winnersCount={winners.length}
          creditValueType={creditValueType}
          winner={winner}
          totalValueError={totalValueError}
          removeWinner={removeWinner}
          onWinnerValueChange={onWinnerValueChange}
        />
      ))}
    </div>
  );
}
