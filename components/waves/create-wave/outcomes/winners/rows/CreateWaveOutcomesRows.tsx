import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CreateWaveOutcomeConfig } from "@/types/waves.types";
import CreateWaveOutcomesRow from "./CreateWaveOutcomesRow";

export default function CreateWaveOutcomesRows({
  waveType,
  errors,
  outcomes,
  setOutcomes,
}: {
  readonly waveType: ApiWaveType;
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
        <div
          className={`${
            showNoOutcomesError ? "tw-border-error/40" : "tw-border-iron-800"
          } tw-rounded-lg tw-border tw-border-dashed tw-bg-iron-900/40 tw-px-4 tw-py-5 tw-transition tw-duration-300 tw-ease-out`}
        >
          <p
            className={`${
              showNoOutcomesError ? "tw-text-error" : "tw-text-iron-200"
            } tw-mb-0 tw-text-sm tw-font-semibold`}
          >
            {t(DEFAULT_LOCALE, "waves.create.outcomes.empty.title")}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            {t(DEFAULT_LOCALE, "waves.create.outcomes.empty.description")}
          </p>
        </div>
      )}
    </div>
  );
}
