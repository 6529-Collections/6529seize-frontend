import type { CreateWaveOutcomeConfigWinner } from "@/types/waves.types";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";
import {
  CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES,
  CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES,
  getCreateWaveOutcomeInputStateClasses,
  getCreateWaveOutcomeLabelStateClasses,
} from "../createWaveOutcomeStyles";

export default function CreateWaveOutcomesWinnersRow({
  winner,
  winnersCount,
  creditValueType,
  i,
  outcomeType,
  isError,
  removeWinner,
  onWinnerValueChange,
}: {
  readonly winner: CreateWaveOutcomeConfigWinner;
  readonly winnersCount: number;
  readonly i: number;
  readonly creditValueType: CreateWaveOutcomeConfigWinnersCreditValueType;
  readonly outcomeType: CreateWaveOutcomeType;
  readonly isError: boolean;
  readonly removeWinner: (index: number) => void;
  readonly onWinnerValueChange: (param: {
    value: number;
    index: number;
  }) => void;
}) {
  const OUTCOME_TYPE_LABELS: Record<CreateWaveOutcomeType, string> = {
    [CreateWaveOutcomeType.MANUAL]: "Manual",
    [CreateWaveOutcomeType.REP]: "Rep",
    [CreateWaveOutcomeType.NIC]: "NIC",
  };

  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onWinnerValueChange({ value, index: i });
    } else {
      onWinnerValueChange({ value: 0, index: i });
    }
  };

  const showRemove = winnersCount > 1;

  const inputEndLabel =
    creditValueType === CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE
      ? "%"
      : OUTCOME_TYPE_LABELS[outcomeType];
  return (
    <div>
      <div className="tw-flex">
        <div className="tw-relative">
          <input
            id={`outcome-winner-value-${i}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={winner.value}
            onChange={onValueChange}
            autoComplete="off"
            aria-invalid={isError}
            className={`${getCreateWaveOutcomeInputStateClasses({
              hasError: isError,
              hasValue: winner.value > 0,
            })} ${CREATE_WAVE_OUTCOME_LIGHT_INPUT_CLASSES} tw-pr-16`}
            placeholder=" "
          />
          <label
            htmlFor={`outcome-winner-value-${i}`}
            className={`${getCreateWaveOutcomeLabelStateClasses(
              isError
            )} ${CREATE_WAVE_OUTCOME_FLOATING_LABEL_CLASSES}`}
          >
            #{i + 1}
          </label>
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
            <span className="tw-text-sm tw-font-normal tw-text-iron-500">
              {inputEndLabel}
            </span>
          </div>
        </div>
        {showRemove && (
          <div className="tw-ml-3 tw-mt-3">
            <button
              onClick={() => removeWinner(i)}
              type="button"
              aria-label="Remove"
              className="tw-flex tw-h-8 tw-w-8 tw-transform tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-scale-90"
            >
              <svg
                className="tw-h-5 tw-w-5 tw-cursor-pointer"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 7L7 17M7 7L17 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
