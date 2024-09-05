import { Wave } from "../../../../generated/models/Wave";

export default function WaveRequiredMetadata({
  wave,
}: {
  readonly wave: Wave;
}) {
  return (
    <div className="tw-w-full">
      <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
        <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
          <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
            <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
              Required Metadata
            </p>
          </div>
          <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-2">
            <div className="tw-flex tw-flex-col tw-gap-y-6">
              <div className="tw-group tw-text-sm tw-flex tw-flex-col">
                <span className="tw-font-medium tw-text-iron-400">title</span>
                <div className="tw-flex tw-w-full tw-justify-between">
                  <span className="tw-font-medium tw-text-white tw-text-md">
                    text
                  </span>
                  <div>
                    <button
                      title="Remove"
                      className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center group-hover:tw-block tw-hidden"
                    >
                      <svg
                        className="tw-flex-shrink-0 tw-size-5 tw-text-red tw-transition tw-duration-300 tw-ease-out hover:tw-scale-110"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {/*  <div>remove modal</div> */}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-sm tw-font-medium tw-gap-x-1 tw-flex tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="tw-size-5 tw-flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span>Add new</span>
              </button>
            </div>

            <div className="tw-flex">
              <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
                <button
                  title="Text"
                  className="tw-ring-iron-650 tw-bg-iron-900 hover:tw-bg-iron-800 tw-text-iron-300 tw-flex-shrink-0 tw-ring-1 tw-ring-inset focus:tw-z-10 tw-rounded-l-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-8 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  <svg
                    className="tw-h-[0.85rem] tw-w-[0.85rem] tw-flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 7C4 6.06812 4 5.60218 4.15224 5.23463C4.35523 4.74458 4.74458 4.35523 5.23463 4.15224C5.60218 4 6.06812 4 7 4H17C17.9319 4 18.3978 4 18.7654 4.15224C19.2554 4.35523 19.6448 4.74458 19.8478 5.23463C20 5.60218 20 6.06812 20 7M9 20H15M12 4V20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  title="Number"
                  className="tw-ring-iron-650 tw-bg-iron-900 hover:tw-bg-iron-800 tw-text-iron-300 tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-8 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  <svg
                    className="tw-h-3 tw-w-3 tw-flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 512"
                    aria-hidden="true"
                  >
                    {/* !Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                    <path
                      fill="currentColor"
                      d="M160 64c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.8 1.6l-96 64C-.5 111.2-4.4 131 5.4 145.8s29.7 18.7 44.4 8.9L96 123.8V416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H160V64z"
                    />
                  </svg>
                </button>
              </span>
              <div className="tw-relative tw-w-full">
                <input
                  type="text"
                  autoComplete="off"
                  className="tw-border-iron-650 tw-ring-iron-650  focus:tw-border-blue-500  focus:tw-ring-primary-400
             tw-form-input tw-block tw-px-4 tw-pb-2 tw-pt-3 tw-w-full tw-text-sm tw-rounded-r-lg tw-border-0 tw-appearance-none tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <div
                  role="button"
                  aria-label="Remove item"
                  className="tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
                >
                  <svg
                    className="tw-top-2.5 tw-cursor-pointer tw-absolute tw-right-3 tw-h-5 tw-w-5"
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

                <label className="tw-absolute tw-cursor-text tw-text-sm tw-font-normal tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1">
                  Name
                </label>
              </div>
            </div>

            <div className="tw-mt-2 sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-2">
              <button
                type="button"
                className="tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-px-3 tw-py-2 tw-text-sm tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white tw-transition tw-duration-300 tw-ease-out"
              >
                <div>Save</div>
              </button>
              <button
                type="button"
                className="tw-mt-3 sm:tw-mt-0 tw-w-full hover:tw-bg-iron-800 sm:tw-w-auto tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
