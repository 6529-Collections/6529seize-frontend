import { Wave } from "../../../../generated/models/Wave";

export default function WaveRequiredMetadata({
  wave,
}: {
  readonly wave: Wave;
}) {
  return (
    <div className="tw-w-full">
      <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
        <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
          <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
            <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
              Required Metadata
            </p>
          </div>
          <div className="tw-px-6 tw-py-6 tw-flex tw-flex-col tw-gap-y-6">
            <div className="tw-group tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
              <span className="tw-font-medium tw-text-iron-400">title</span>
              <div className="tw-flex tw-w-full tw-justify-between">
                <span className="tw-font-medium tw-text-white tw-text-md">
                  text
                </span>
                <div className="tw-inline-flex tw-items-center tw-gap-x-2">
                  buttons
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
