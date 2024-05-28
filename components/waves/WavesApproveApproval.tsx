export default function WavesApproveApproval() {
  return (
    <div className="tw-max-w-xl tw-mx-auto tw-w-full">
      <div className="tw-pt-6">
        <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
          Approval
        </p>
        <div className="tw-mt-4">
          <div className="tw-group tw-w-full tw-relative">
            <input
              type="text"
              onChange={() => {}}
              id="floating_threshold"
              className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="floating_threshold"
              className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Threshold
            </label>
          </div>
          <div className="tw-mt-6 tw-col-span-full">
            <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
              Select time
            </p>
            <div className="tw-mt-2.5 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
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
            className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            <span>Finish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
