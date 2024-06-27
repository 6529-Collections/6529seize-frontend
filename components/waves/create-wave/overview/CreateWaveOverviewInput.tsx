export default function CreateWaveOverviewInput({
  value,
  valueKey,
  isError,
  onValueChange,
}: {
  readonly value: string;
  readonly valueKey: "name";
  readonly isError: boolean;
  readonly onValueChange: (param: {
    readonly key: "name";
    readonly value: string;
  }) => void;
}) {
  const LABELS: Record<"name", string> = {
    name: "Name",
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange({ key: valueKey, value: event.target.value });
  };

  return (
    <div className="tw-relative">
      <input
        type="text"
        onChange={onChange}
        value={value}
        id={valueKey}
        autoComplete="off"
        className={`${
          isError
            ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
            : "tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400 tw-caret-primary-400"
        } tw-form-input tw-block tw-px-4 tw-pt-4 tw-pb-3 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600  tw-peer
      tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset  tw-transition tw-duration-300 tw-ease-out`}
        placeholder=" "
      />
      <label
        htmlFor={valueKey}
        className={`${
          isError
            ? "peer-focus:tw-text-error"
            : "peer-focus:tw-text-primary-400"
        } tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
      >
        {LABELS[valueKey]}
      </label>
      {isError && (
        <div className="tw-absolute tw-right-3 tw-top-3 tw-text-error">
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
        </div>
      )}
    </div>
  );
}
