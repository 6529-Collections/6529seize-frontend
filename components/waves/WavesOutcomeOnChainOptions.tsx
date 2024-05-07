export default function WavesOutcomeOnChainOptions() {
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-x-4 tw-gap-y-4">
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">Ethereum</span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">Base</span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">BTC</span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-block tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-opacity-60 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none sm:tw-flex sm:tw-items-center tw-gap-x-3">
        <input
          type="radio"
          className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-600">Solana</span>
          </span>
        </span>
      </div>
    </div>
  );
}
