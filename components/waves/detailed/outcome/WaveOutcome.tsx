export default function WaveOutcome() {
  return (
    <div className="tw-w-full">
      <div className="tw-group">
        <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
          <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
            <div className="tw-px-4 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
              <p className="tw-mb-0 tw-text-xl tw-text-white tw-font-semibold">
                Outcome
              </p>
            </div>
            <div className="tw-px-4 tw-py-4 tw-flex tw-flex-col tw-gap-y-6">
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                <span className="tw-font-medium tw-text-iron-400">
                  Threshold
                </span>
                <span className="tw-font-medium tw-text-white tw-text-base">
                  200
                </span>
              </div>
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                <span className="tw-font-medium tw-text-iron-400">Time</span>
                <span className="tw-font-medium tw-text-white tw-text-base">
                  2 weeks
                </span>
              </div>
              <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
                <span className="tw-font-medium tw-text-iron-400">Winners</span>
                <span className="tw-font-medium tw-text-white tw-text-base">
                  2 weeks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}