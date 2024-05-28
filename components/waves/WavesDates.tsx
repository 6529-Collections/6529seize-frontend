export default function WavesGroupInputs() {
  return (
    <div className="tw-max-w-2xl tw-mx-auto tw-w-full">
      <div className="tw-relative tw-grid tw-grid-cols-1 tw-gap-y-10 tw-gap-x-10 md:tw-grid-cols-2">
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
            Select start date
          </p>
          <div className="tw-mt-4 tw-py-3 tw-px-2 tw-relative tw-rounded-lg tw-bg-iron-900 tw-shadow tw-ring-1 tw-ring-iron-600">
            <button
              type="button"
              className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute 
              tw-left-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
            >
              <span className="tw-sr-only">Previous month</span>
              <svg
                className="tw-h-6 tw-w-6 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute tw-right-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
            >
              <span className="tw-sr-only">Next month</span>
              <svg
                className="tw-h-6 tw-w-6 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <section className="tw-text-center">
              <p className="tw-text-base tw-font-medium tw-text-iron-50">
                January
              </p>
              <div className="tw-mt-4 tw-grid tw-grid-cols-7 tw-text-sm tw-leading-6 tw-font-medium tw-text-iron-500">
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
                <div>Su</div>
              </div>
              <div className="tw-p-1 tw-isolate tw-mt-2 tw-grid tw-grid-cols-7 tw-gap-px ">
                <button
                  type="button"
                  className="tw-relative tw-bg-primary-500 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-50 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out 
              focus:tw-z-10 tw-font-semibold"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    1
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    2
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    3
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    4
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    5
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    6
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    7
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
        <div className="tw-col-span-1">
          <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
            Select end date{" "}
            <span className="tw-text-base tw-font-semibold tw-text-iron-400">
              (optional)
            </span>
          </p>
          <div className="tw-mt-4 tw-py-3 tw-px-2 tw-relative tw-rounded-lg tw-bg-iron-900 tw-shadow tw-ring-1 tw-ring-iron-600">
            <button
              type="button"
              className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute tw-left-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
            >
              <span className="tw-sr-only">Previous month</span>
              <svg
                className="tw-h-6 tw-w-6 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute tw-right-1.5 tw-top-1.5 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
            >
              <span className="tw-sr-only">Next month</span>

              <svg
                className="tw-h-6 tw-w-6 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <section className="tw-text-center">
              <p className="tw-text-base tw-font-medium tw-text-iron-50">
                February
              </p>
              <div className="tw-mt-4 tw-grid tw-grid-cols-7 tw-text-sm tw-leading-6 tw-text-iron-500">
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
                <div>Su</div>
              </div>
              <div className="tw-p-1 tw-isolate tw-mt-2 tw-grid tw-grid-cols-7 tw-gap-px">
                <button
                  type="button"
                  className="tw-relative tw-rounded-lg tw-bg-primary-500 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-50 hover:tw-border-primary-500 tw-transition tw-duration-300 tw-ease-out 
              focus:tw-z-10 tw-font-semibold"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    1
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    2
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    3
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    4
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    5
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    6
                  </div>
                </button>
                <button
                  type="button"
                  className="tw-relative tw-bg-iron-800 tw-border tw-border-transparent tw-border-solid tw-h-9 tw-w-9 tw-text-iron-300 hover:tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out focus:tw-z-10"
                >
                  <div className="tw-mx-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full">
                    7
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
        <div className="tw-col-span-full">
          <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
            Select time
          </p>
          <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
            <div className="tw-relative">
              <button
                type="button"
                className="tw-w-full tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-bg-iron-800 lg:tw-bg-iron-900 tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base hover:tw-bg-iron-800 focus:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between"
              >
                <span className="tw-text-iron-500 tw-font-medium">
                  Set time
                </span>
              </button>
              <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
                <svg
                  className="tw-h-5 tw-w-5 tw-text-iron-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <div className="tw-z-10 tw-mt-1 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5">
                <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                  <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                    <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                      <li>
                        <div className=" hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2.5 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                          <span className="tw-text-base tw-font-medium tw-text-white">
                            20
                          </span>
                        </div>
                      </li>
                      <li>
                        <div className=" hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2.5 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                          <span className="tw-text-base tw-font-medium tw-text-white">
                            30
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="tw-relative">
              <button
                type="button"
                className="tw-w-full tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-bg-iron-800 lg:tw-bg-iron-900 tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base hover:tw-bg-iron-800 focus:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between"
              >
                <span className="tw-text-iron-500 tw-font-medium">
                  Choose period
                </span>
              </button>
              <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
                <svg
                  className="tw-h-5 tw-w-5 tw-text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              <div className="tw-z-10 tw-mt-1 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5">
                <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                  <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                    <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                      <li className="tw-h-full">
                        <div className=" hover:tw-bg-iron-700 tw-py-3 tw-w-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                          <span className="tw-text-base tw-font-medium tw-text-white">
                            Minutes
                          </span>
                        </div>
                      </li>
                      <li className="tw-h-full">
                        <div className="hover:tw-bg-iron-700 tw-py-3 tw-w-full tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                          <span className="tw-text-base tw-font-semibold tw-text-primary-400">
                            Hours
                          </span>
                          <svg
                            className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
