import { WaveType } from "../../../../../../generated/models/WaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "../../../../../../helpers/waves/create-wave.helpers";
import { CreateWaveOutcomeConfig } from "../../../../../../types/waves.types";
import CreateWaveOutcomesRow from "./CreateWaveOutcomesRow";

export default function CreateWaveOutcomesRows({
  waveType,
  errors,
  outcomes,
  setOutcomes,
}: {
  readonly waveType: WaveType;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly outcomes: CreateWaveOutcomeConfig[];
  readonly setOutcomes: (outcomes: CreateWaveOutcomeConfig[]) => void;
}) {
  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const showNoOutcomesError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.OUTCOMES_REQUIRED
  );
  return (
    <div className="tw-flex tw-flex-col tw-gap-x-4 tw-gap-y-4">
      {outcomes.length ? (
        outcomes.map((outcome, i) => (
          <CreateWaveOutcomesRow
            key={i}
            waveType={waveType}
            outcome={outcome}
            removeOutcome={() => removeOutcome(i)}
          />
        ))
      ) : (
        <div className="tw-py-4">
          <span
            className={`${
              showNoOutcomesError ? "tw-text-error" : "tw-text-iron-500"
            } tw-px-4 sm:tw-px-6 tw-text-sm sm:tw-text-md tw-italic  tw-transition tw-duration-300 tw-ease-out`}
          >
            No outcomes added
          </span>
        </div>
      )}
    </div>
  );
}
