export default function WavesOutcomeManualOptions() {
  return (
    <div className="tw-grid sm:tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
      <div className="tw-relative tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400 tw-bg-primary-400/10 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none tw-flex tw-items-center tw-gap-x-3 tw-transition tw-duration-300 tw-ease-out">
        <input
          type="radio"
          checked
          className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-500 focus:tw-ring-primary-500 tw-cursor-pointer"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-bold tw-text-primary-400">Onsite</span>
          </span>
        </span>
      </div>
      <div className="tw-relative tw-cursor-pointer tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-800 tw-px-6 tw-py-5 tw-shadow-sm focus:tw-outline-none tw-flex tw-items-center tw-gap-x-3 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
        <input
          type="radio"
          className="tw-form-radio tw-h-5 tw-w-5 tw-bg-iron-800 tw-border-iron-600 tw-border tw-border-solid focus:tw-ring-2 tw-ring-offset-iron-800 tw-text-primary-400 focus:tw-ring-primary-400 tw-cursor-pointer"
        />
        <span className="tw-flex tw-items-center">
          <span className="tw-flex tw-flex-col tw-text-sm">
            <span className="tw-font-semibold tw-text-iron-300">Drops</span>
          </span>
        </span>
      </div>
    </div>
  );
}
