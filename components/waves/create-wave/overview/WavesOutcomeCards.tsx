export default function WavesOutcomeCards() {
  return (
    <div className="tw-flex tw-flex-col tw-gap-x-4 tw-gap-y-4">
      <div className="tw-bg-iron-900 tw-rounded-xl tw-ring-1 tw-ring-iron-700 tw-px-4 tw-py-4">
        <div className="tw-flex tw-justify-between">
          <div className="tw-flex tw-flex-col">
            <h3 className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              Rep
            </h3>
            <div className="tw-inline-flex tw-gap-x-4">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
                Winner of Wave
              </p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">100 winners</p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">420 rep</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove"
            className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="tw-bg-iron-900 tw-rounded-xl tw-ring-1 tw-ring-iron-700 tw-px-4 tw-py-4">
        <div className="tw-flex tw-justify-between">
          <div className="tw-flex tw-flex-col">
            <h3 className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              Manual
            </h3>
            <div className="tw-inline-flex tw-gap-x-4">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">100 winners</p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">420 rep</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove"
            className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="tw-bg-iron-900 tw-rounded-xl tw-ring-1 tw-ring-iron-700 tw-px-4 tw-py-4">
        <div className="tw-flex tw-justify-between">
          <div className="tw-flex tw-flex-col">
            <h3 className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              CIC
            </h3>
            <div className="tw-inline-flex tw-gap-x-4">
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">100 winners</p>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">420 rep</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove"
            className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
