export default function WavesOutcomeGeneralDataOptions() {
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-300">To IPFS</span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">
              To Arweave
            </span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">
              To a web server
            </span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-[#232329] tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-h-5 tw-w-5 tw-border-iron-600 tw-text-primary-500 focus:tw-ring-primary-500"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">To an API</span>
          </span>
        </span>
      </div>
    </div>
  );
}
