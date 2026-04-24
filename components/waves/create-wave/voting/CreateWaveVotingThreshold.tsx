export default function CreateWaveVotingThreshold({
  threshold,
  error,
  setThreshold,
}: {
  readonly threshold: number | null;
  readonly error: boolean;
  readonly setThreshold: (threshold: number | null) => void;
}) {
  const onThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = parseInt(e.target.value);
    const isValid = !isNaN(newThreshold);
    setThreshold(isValid ? newThreshold : null);
  };
  const hasThreshold = threshold !== null && !Number.isNaN(threshold);

  return (
    <div className="tw-mt-6 tw-w-full">
      <div className="tw-group tw-relative tw-w-full">
        <div className="tw-relative">
          <input
            type="text"
            autoComplete="off"
            value={hasThreshold ? threshold.toString() : ""}
            onChange={onThresholdChange}
            id="approve-winning-threshold"
            className={`${
              error
                ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                : "tw-border-iron-650 tw-caret-primary-400 tw-ring-iron-650 focus:tw-border-primary-400 focus:tw-ring-primary-400"
            } ${
              hasThreshold
                ? "tw-text-primary-400 focus:tw-text-white"
                : "tw-text-white peer-focus:tw-text-white"
            } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 peer-placeholder-shown:tw-text-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm`}
            placeholder=" "
          />
          <label
            htmlFor="approve-winning-threshold"
            className={`${
              error
                ? "peer-focus:tw-text-error"
                : "peer-focus:tw-text-primary-400"
            } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
          >
            Threshold
          </label>
        </div>
        {error && (
          <div className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-error"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="tw-relative tw-z-10 tw-text-xs tw-font-medium tw-text-error">
              Please set threshold
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
