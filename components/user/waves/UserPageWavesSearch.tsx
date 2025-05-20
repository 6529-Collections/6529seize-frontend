import PrimaryButton from "../../utils/button/PrimaryButton";

export default function UserPageWavesSearch({
  waveName,
  showCreateNewWaveButton,
  setWaveName,
  onCreateNewWave,
}: {
  readonly waveName: string | null;
  readonly showCreateNewWaveButton: boolean;
  readonly setWaveName: (value: string | null) => void;
  readonly onCreateNewWave: () => void;
}) {
  const onWaveNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWaveName(event.target.value);
  };

  return (
    <div className="tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row tw-w-full sm:tw-items-center sm:tw-justify-between tw-gap-x-3 tw-gap-y-3">
      <div className="sm:tw-max-w-xs tw-w-full">
        <div className="tw-group tw-w-full tw-relative">
          <input
            type="text"
            value={waveName ?? ""}
            onChange={onWaveNameChange}
            id="identity-page-wave-search"
            autoComplete="off"
            className="tw-py-3 tw-text-sm tw-ring-iron-700 focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400 hover:tw-ring-iron-650 tw-form-input tw-block tw-w-full  tw-rounded-lg tw-border-0 tw-appearance-none tw-font-medium tw-border-iron-700 tw-peer tw-pl-10 tw-pr-4 tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out tw-text-white"
            placeholder=" "
          />
          <svg
            className={`tw-top-3 tw-pointer-events-none tw-absolute tw-left-3 tw-h-5 tw-w-5 tw-text-iron-300`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            ></path>
          </svg>
          {!!waveName?.length && (
            <svg
              onClick={() => setWaveName(null)}
              className="tw-top-3 tw-cursor-pointer tw-absolute tw-right-3 tw-h-5 tw-w-5 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="none"
              role="button"
              tabIndex={0}
              aria-label="Clear wave name"
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
          )}
          <label
            htmlFor="identity-page-wave-search"
            className="tw-text-sm peer-focus:tw-text-primary-400 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 tw-absolute tw-rounded-lg tw-cursor-text tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900  peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2  peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            By Wave Name
          </label>
        </div>
      </div>
      {showCreateNewWaveButton && (
        <PrimaryButton
          onClicked={onCreateNewWave}
          loading={false}
          disabled={false}
        >
          <svg
            className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Create new</span>
        </PrimaryButton>
      )}
    </div>
  );
}
