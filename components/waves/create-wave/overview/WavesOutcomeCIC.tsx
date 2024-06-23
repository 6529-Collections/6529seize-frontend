export default function WavesOutcomeRCIC() {
  return (
    <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-gap-4 tw-w-full">
        <div className="tw-flex-1">
          <div className="tw-relative tw-w-full">
            <input
              type="text"
              autoComplete="off"
              className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
           peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Amount
            </label>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-gap-x-3 tw-items-start">
        <div className="tw-flex">
          <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
            <button
              type="button"
              className="tw-border-0 tw-relative tw-inline-flex tw-items-center tw-rounded-l-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-z-10"
            >
              Percentage
            </button>
            <button
              type="button"
              className="tw-border-0 tw-relative -ml-px inline-flex items-center tw-rounded-r-lg tw-bg-iron-800 px-3 py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700  focus:tw-z-10"
            >
              Number
            </button>
          </span>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <div className="tw-flex">
            <div className="tw-relative">
              <input
                type="text"
                autoComplete="off"
                className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                placeholder=" "
              />
              <label
                className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
           peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
              >
                #1
              </label>
            </div>
            <div className="tw-mt-3.5 tw-ml-4">
              <div
                role="button"
                aria-label="Remove item"
                className="tw-text-error tw-transition tw-duration-300 tw-ease-out"
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
              </div>
            </div>
          </div>

          <div className="tw-flex">
            <button
              type="button"
              className="tw-py-1 tw-px-2 tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-text-sm tw-text-primary-400 hover:tw-text-primary-300 
 tw-font-semibold tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-h-5 tw-w-5 tw-mr-2 tw-flex-shrink-0"
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
              <span>Add winner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
