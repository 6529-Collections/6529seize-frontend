import type { CreateWaveOutcomeConfigWinner } from "@/types/waves.types";
import {
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "@/types/waves.types";

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
            type="text"
            inputMode="numeric"
            value={winner.value}
            onChange={onValueChange}
            autoComplete="off"
            className={`${
              isError
                ? "tw-text-error tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                : "tw-text-white tw-caret-primary-400 tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
            } tw-peer tw-form-input tw-block tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`}
            placeholder=" "
          />
          <label
            className={`${
              isError
                ? "tw-text-error peer-focus:tw-text-error"
                : "tw-text-iron-500 peer-focus:tw-text-primary-400"
            } tw-absolute tw-start-1 tw-top-2 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
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
