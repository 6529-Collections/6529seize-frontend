import { CreateWaveOutcomeConfig } from "../../../../../types/waves.types";
import CreateWaveOutcomesRow from "./CreateWaveOutcomesRow";

export default function CreateWaveOutcomesRows({
  outcomes,
  setOutcomes,
}: {
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
}) {
  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };
  return (
    <div className="tw-flex tw-flex-col tw-gap-x-4 tw-gap-y-4">
      {outcomes.map((outcome, i) => (
        <CreateWaveOutcomesRow
          key={i}
          outcome={outcome}
          removeOutcome={() => removeOutcome(i)}
        />
      ))}
    </div>
  );
}
