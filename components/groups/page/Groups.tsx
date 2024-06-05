export default function Groups() {
  return (
    <div className="tailwind-scope tw-relative tw-z-10">
      <div className="tw-max-w-2xl tw-mx-auto">
        <div className="tw-flex tw-flex-col tw-gap-y-8">
          <div className="tw-space-y-5">
            <div className="tw-inline-flex tw-items-center tw-space-x-4">
              <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
                <svg
                  className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 tw-size-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
              </span>
              <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
                Create a group
              </p>
            </div>
            <div className="tw-p-8 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
              <div className="tw-group tw-w-full tw-relative">
                <input
                  type="text"
                  id="floating_name"
                  autoComplete="off"
                  className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                  placeholder=" "
                />
                <label
                  htmlFor="floating_name"
                  className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                >
                  Name*
                </label>
              </div>
            </div>
          </div>
          <div className="tw-space-y-5">
            <div className="tw-inline-flex tw-items-center tw-space-x-4">
              <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
                <svg
                  className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 tw-size-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                  />
                </svg>
              </span>
              <p className="tw-mb-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
                Types
              </p>
            </div>
            <div className="tw-py-8 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
              <div className="tw-px-8 tw-flex tw-flex-col tw-gap-y-6">
                <div>
                  <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                    Level
                  </p>
                  <div className="tw-mt-2 tw-group tw-w-full tw-relative">
                    <input
                      type="text"
                      id="floating_level"
                      className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                      placeholder=" "
                    />
                    <label
                      htmlFor="floating_level"
                      className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                    >
                      Level at least
                    </label>
                  </div>
                </div>
                <div>
                  <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                    TDH
                  </p>
                  <div className="tw-mt-4 tw-group tw-w-full tw-relative">
                    <input
                      type="text"
                      id="floating_tdh"
                      className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                      placeholder=" "
                    />
                    <label
                      htmlFor="floating_tdh"
                      className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                    >
                      TDH
                    </label>
                  </div>
                </div>
                <div className="tw-flex tw-flex-col">
                  <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                    CIC
                  </p>
                  <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-3">
                    <div className="tw-group tw-w-full tw-relative">
                      <input
                        type="text"
                        id="floating_cic_user"
                        className="tw-form-input tw-block tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                        placeholder=" "
                      />
                      <svg
                        className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-4 tw-h-5 tw-w-5 tw-text-iron-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                      <label
                        htmlFor="floating_cic_user"
                        className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-8 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                        peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                      >
                        User
                      </label>
                    </div>

                    <div className="tw-group tw-w-full tw-relative">
                      <input
                        type="text"
                        id="floating_cic"
                        className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                        placeholder=" "
                      />
                      <label
                        htmlFor="floating_cic"
                        className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                      >
                        CIC at least
                      </label>
                    </div>
                  </div>
                </div>
                <div className="tw-flex tw-flex-col tw-space-y-4">
                  <div className="tw-flex tw-flex-col">
                    <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                      Rep
                    </p>
                    <div className="tw-mt-2 tw-flex tw-gap-x-5">
                      <div className="tw-group tw-w-full tw-relative">
                        <input
                          type="text"
                          id="floating_rep_user"
                          className="tw-form-input tw-block tw-pl-11 tw-pr-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                          placeholder=" "
                        />
                        <svg
                          className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-4 tw-h-5 tw-w-5 tw-text-iron-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                        <label
                          htmlFor="floating_rep_user"
                          className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-8 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                        >
                          User
                        </label>
                      </div>
                      <div className="tw-group tw-w-full tw-relative">
                        <input
                          type="text"
                          id="floating_rep_category"
                          className="tw-form-input tw-block tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                          placeholder=" "
                        />
                        <svg
                          className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-4 tw-h-5 tw-w-5 tw-text-iron-300"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                        <label
                          htmlFor="floating_rep_category"
                          className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-8 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                      peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                        >
                          Rep Category
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="tw-group tw-w-full tw-relative">
                    <input
                      type="text"
                      id="floating_rep"
                      className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                      placeholder=" "
                    />
                    <label
                      htmlFor="floating_rep"
                      className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
                    >
                      Rep at least
                    </label>
                  </div>
                </div>
                <div>
                  <div className="tw-inline-flex tw-items-center tw-space-x-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="tw-size-6 tw-text-iron-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                      />
                    </svg>
                    <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                      Add wallets manually
                    </p>
                  </div>
                  <div
                    className="tw-mt-2 
        tw-bg-iron-900 tw-border-iron-650
      tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-40 tw-border-2 tw-border-dashed tw-rounded-lg tw-cursor-pointer  hover:tw-border-iron-600 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out
      "
                  >
                    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-pt-5 tw-pb-6">
                      
                    </div>
                  </div>
                </div>
              </div>
              <div className="tw-px-8 tw-pt-6 tw-mt-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-700">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-end">
                  {/* COMPONENDIKS - SECONDARYBUTTON */}
                  <button
                    type="button"
                    className="tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
                  >
                    Cancel
                  </button>
                  {/* COMPONENDIKS - PRIMARYBUTTON */}
                  <button
                    type="button"
                    className="tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-bg-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
