import Countdown from "../../distribution-plan-tool/common/Countdown";

export default function BlockPickerResultHeader({
  timestamp,
  blocknumber,
}: {
  timestamp: number;
  blocknumber: number;
}) {
  return (
    <div className="tw-mt-8 tw-pt-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-neutral-700">
      <div className="sm:tw-flex sm:tw-items-baseline sm:tw-justify-between">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="tw-space-x-1">
            <span className="tw-text-base tw-text-white tw-font-semibold">
              Block number:
            </span>
            <span className="tw-text-base tw-text-white tw-font-semibold">
              {blocknumber}
            </span>
          </div>
          <span className="tw-mt-0.5 tw-font-light tw-text-sm tw-text-neutral-300">
            is the closest block to
          </span>
          <div className="tw-mt-0.5 tw-text-sm tw-text-white tw-font-semibold">
            <Countdown timestamp={timestamp} />
          </div>
        </div>
      </div>
    </div>
  );
}
