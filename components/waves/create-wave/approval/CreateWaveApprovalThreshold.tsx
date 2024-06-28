export default function CreateWaveApprovalThreshold({
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

  return (
    <div className="tw-group tw-w-full tw-relative">
      <div className="tw-relative">
        <input
          type="text"
          value={threshold !== null ? threshold.toString() : ""}
          onChange={onThresholdChange}
          id="floating_threshold"
          className={`${
            error
              ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
              : "tw-border-iron-650 tw-ring-iron-650  focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400"
          } tw-form-input tw-block tw-px-4 tw-py-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-peer
     tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
          placeholder=" "
        />
        <label
          htmlFor="floating_threshold"
          className={`${
            error
              ? "peer-focus:tw-text-error"
              : "peer-focus:tw-text-primary-400"
          } tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
        >
          Threshold
        </label>
      </div>
      {error && (
        <div className="tw-relative tw-mt-1.5 tw-z-10 tw-text-error tw-text-xs tw-font-medium">
          Please set threshold
        </div>
      )}
    </div>
  );
}
