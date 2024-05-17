export default function WavesGroupInputs() {
  return (
    <div className="tw-max-w-2xl tw-mx-auto tw-w-full">
      <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
        Select period
      </p>
      <div className="tw-mt-5 tw-relative tw-grid tw-grid-cols-1 tw-gap-y-10 tw-gap-x-12 md:tw-grid-cols-2">
        <div className="tw-relative">
          <button
            type="button"
            className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute -tw-left-1.5 -tw-top-1 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
          >
            <span className="tw-sr-only">Previous month</span>
            <svg
              className="tw-h-6 tw-w-6 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="none"
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
            className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute -tw-right-1.5 -tw-top-1 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
          >
            <span className="tw-sr-only">Next month</span>

            <svg
              className="tw-h-6 tw-w-6 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="none"
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
            <div className="tw-mt-6 tw-grid tw-grid-cols-7 tw-text-sm tw-leading-6 tw-font-medium tw-text-iron-500">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
              <div>Su</div>
            </div>
            <div className="tw-p-1 tw-isolate tw-mt-2 tw-grid tw-grid-cols-7 tw-gap-px tw-rounded-lg tw-bg-iron-800 tw-text-base tw-shadow tw-ring-1 tw-ring-iron-700">
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
        <div className="tw-relative">
          <button
            type="button"
            className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute -tw-left-1.5 -tw-top-1 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
          >
            <span className="tw-sr-only">Previous month</span>
            <svg
              className="tw-h-6 tw-w-6 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="none"
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
            className="tw-bg-transparent tw-border tw-border-transparent tw-border-solid tw-absolute -tw-right-1.5 -tw-top-1 tw-flex tw-items-center tw-justify-center tw-p-1.5 tw-text-iron-300 hover:tw-text-iron-500"
          >
            <span className="tw-sr-only">Next month</span>

            <svg
              className="tw-h-6 tw-w-6 tw-text-iron-300"
              viewBox="0 0 24 24"
              fill="none"
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
            <div className="tw-mt-6 tw-grid tw-grid-cols-7 tw-text-sm tw-leading-6 tw-text-iron-500">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
              <div>Su</div>
            </div>
            <div className="tw-p-1 tw-isolate tw-mt-2 tw-grid tw-grid-cols-7 tw-gap-px tw-rounded-lg tw-bg-iron-800 tw-text-base tw-shadow tw-ring-1 tw-ring-iron-700">
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
            <p className="tw-mt-1.5 tw-text-xs tw-text-iron-500 tw-font-normal tw-text-right tw-mb-0">
              End date is optional
            </p>
          </section>
        </div>
      </div>
      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-w-full sm:tw-w-auto tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
