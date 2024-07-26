import {
  CreateWaveOutcomeConfigWinner,
  CreateWaveOutcomeConfigWinnersCreditValueType,
  CreateWaveOutcomeType,
} from "../../../../../types/waves.types";

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
    [CreateWaveOutcomeType.CIC]: "CIC",
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
            value={winner.value}
            onChange={onValueChange}
            autoComplete="off"
            className={`${
              isError
                ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error tw-text-error"
                : "tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400 tw-text-white"
            } tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-border-iron-600 tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
            placeholder=" "
          />
          <label
            className={`${
              isError
                ? "peer-focus:tw-text-error tw-text-error"
                : "peer-focus:tw-text-primary-400 tw-text-iron-500"
            } tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
          >
            #{i + 1}
          </label>
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
            <span className="tw-text-iron-500 tw-text-sm tw-font-normal">
              {inputEndLabel}
            </span>
          </div>
        </div>
        {showRemove && (
          <div className="tw-mt-3 tw-ml-3">
            <button
              onClick={() => removeWinner(i)}
              type="button"
              aria-label="Remove"
              className="tw-h-8 tw-w-8 hover:tw-bg-iron-800 tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full focus:tw-scale-90 tw-transform tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-cursor-pointer tw-h-5 tw-w-5"
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
