import { CreateWaveOutcomeConfigWinner } from "../../../../../types/waves.types";

export default function CreateWaveOutcomesWinnersRows({
  winners,
  setWinners,
}: {
  readonly winners: CreateWaveOutcomeConfigWinner[];
  readonly setWinners: (winners: CreateWaveOutcomeConfigWinner[]) => void;
}) {
  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  return (
    <div className="tw-space-y-2">
      {winners.map((winner, i) => (
        <div key={i} className="tw-flex">
          <div className="tw-relative">
            <input
              type="text"
              autoComplete="off"
              className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
           peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              #{i + 1}
            </label>
          </div>
          <div className="tw-mt-3 tw-ml-3">
            <button
              onClick={() => removeWinner(i)}
              type="button"
              aria-label="Remove"
              className="tw-h-8 tw-w-8 tw-text-error tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800 focus:tw-scale-90 tw-transform tw-transition tw-duration-300 tw-ease-out"
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
        </div>
      ))}
    </div>
  );
}
