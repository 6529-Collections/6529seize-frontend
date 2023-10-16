export default function UserPageBadgeSelector() {
  return (
    <div
      className="tw-hidden tw-relative tw-z-10"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-transition-opacity"></div>

      <div className="tw-fixed tw-inset-0 tw-z-10 tw-w-screen tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div className="tw-relative tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-neutral-900 tw-px-4 tw-pb-4 tw-pt-5 tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full sm:tw-max-w-sm sm:tw-p-6">
            <div className="tw-absolute tw-right-0 tw-top-0 tw-hidden tw-pr-4 tw-pt-4 sm:tw-block">
              <button
                type="button"
                className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
              >
                <span className="tw-sr-only">Close</span>
                <svg
                  className="tw-h-6 tw-w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="tw-mt-3 sm:tw-mt-5 tw-flex tw-flex-col">
              <h3 className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
                Add new category
              </h3>
              <div className="tw-mt-2 tw-relative tw-max-w-lg">
                <div className="tw-max-w-lg">
                  <input
                    type="text"
                    placeholder="Type category"
                    className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 focus:tw-bg-transparent tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                  <div className="tw-pointer-events-none tw-absolute tw-right-0 tw-inset-y-0 tw-flex tw-items-center tw-pr-3">
                    <svg
                      className="tw-h-5 tw-w-5 tw-text-neutral-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
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
            <div className="tw-mt-5 sm:tw-mt-6 tw-flex tw-justify-end">
              <button
                type="button"
                className="tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
              >
                Add new
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
