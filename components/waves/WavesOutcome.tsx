import WavesOutcome6529ActionsOptions from "./WavesOutcome6529ActionsOptions";
import WavesOutcomeAppsOptions from "./WavesOutcomeAppsOptions";
import WavesOutcomeGeneralDataOptions from "./WavesOutcomeGeneralDataOptions";
import WavesOutcomeManualOptions from "./WavesOutcomeManualOptions";
import WavesOutcomeOnChainOptions from "./WavesOutcomeOnChainOptions";
import WavesOutcomeSocialMediaOptions from "./WavesOutcomeSocialMediaOptions";
import WavesOutcomeTabs from "./WavesOutcomeTabs";

export default function WavesOutcome() {
  return (
    <div className="tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">Title</p>
      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
        <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
          <div className="tw-flex tw-flex-col tw-gap-y-4">
            <div className="tw-flex">
              <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
                <button
                  title="Manual action"
                  className="tw-flex-shrink-0 tw-ring-1 tw-ring-inset focus:tw-z-10 tw-rounded-l-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  <svg
                    className="tw-size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.9 11.4444V14.2222M6.9 11.4444V4.77778C6.9 3.8573 7.66112 3.11111 8.6 3.11111C9.53888 3.11111 10.3 3.8573 10.3 4.77778M6.9 11.4444C6.9 10.524 6.13888 9.77778 5.2 9.77778C4.26112 9.77778 3.5 10.524 3.5 11.4444V13.6667C3.5 18.269 7.30558 22 12 22C16.6944 22 20.5 18.269 20.5 13.6667V8.11111C20.5 7.19064 19.7389 6.44444 18.8 6.44444C17.8611 6.44444 17.1 7.19064 17.1 8.11111M10.3 4.77778V10.8889M10.3 4.77778V3.66667C10.3 2.74619 11.0611 2 12 2C12.9389 2 13.7 2.74619 13.7 3.66667V4.77778M13.7 4.77778V10.8889M13.7 4.77778C13.7 3.8573 14.4611 3.11111 15.4 3.11111C16.3389 3.11111 17.1 3.8573 17.1 4.77778V8.11111M17.1 8.11111V10.8889"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  title="Rep"
                  className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  REP
                </button>
                <button
                  title="CIC"
                  className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  CIC
                </button>
              </span>
              <div className="tw-relative tw-w-full">
                <input
                  type="text"
                  autoComplete="off"
                  className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-r-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <label
                  className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  Manual action
                </label>
              </div>
              <div className="tw-mt-3.5 tw-ml-4">
                <div
                  role="button"
                  aria-label="Remove item"
                  className=" tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
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
            <div className="tw-flex tw-gap-x-4">
              <div className="tw-w-[58%]">
                <div className="tw-flex">
                  <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
                    <button
                      title="Text"
                      className="tw-flex-shrink-0 tw-ring-1 tw-ring-inset focus:tw-z-10 tw-rounded-l-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                      type="button"
                    >
                      <svg
                        className="tw-h-5 tw-w-5"
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
                      title="Rep"
                      className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                      type="button"
                    >
                      REP
                    </button>
                    <button
                      title="CIC"
                      className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                      type="button"
                    >
                      CIC
                    </button>
                  </span>
                  <div className="tw-relative tw-w-full">
                    <input
                      type="text"
                      autoComplete="off"
                      className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-r-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                      placeholder=" "
                    />
                    <label
                      className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                      peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                    >
                      Category
                    </label>
                  </div>
                </div>
              </div>
              <div className="tw-w-[42%]">
                <div className="tw-relative">
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
              <div
                role="button"
                aria-label="Remove item"
                className="tw-mt-3.5 tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
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
            <div className="tw-flex">
              <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
                <button
                  title="Text"
                  className="tw-flex-shrink-0 tw-ring-1 tw-ring-inset focus:tw-z-10 tw-rounded-l-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  <svg
                    className="tw-h-5 tw-w-5"
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
                  title="Rep"
                  className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  REP
                </button>
                <button
                  title="CIC"
                  className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
                  type="button"
                >
                  CIC
                </button>
              </span>
              <div className="tw-relative tw-w-full">
                <input
                  type="text"
                  autoComplete="off"
                  className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-r-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
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
              <div className="tw-mt-3.5 tw-ml-4">
                <div
                  role="button"
                  aria-label="Remove item"
                  className=" tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
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
          </div>
          <div className="tw-mt-2 tw-flex tw-justify-center">
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
              <span>Add more</span>
            </button>
          </div>
        </div>
      </div>
      {/* 
      <div className="tw-mt-5">
        <WavesOutcomeTabs />
      </div>
      <div className="tw-mt-6">
        <WavesOutcomeManualOptions />
     <WavesOutcome6529ActionsOptions /> 
    <WavesOutcomeSocialMediaOptions />  
       <WavesOutcomeOnChainOptions />        
       <WavesOutcomeGeneralDataOptions /> 
        <WavesOutcomeAppsOptions /> 
      </div>
      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-w-full sm:tw-w-auto tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div> */}
    </div>
  );
}
