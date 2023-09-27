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
        <div className="sm:tw-w-0 sm:tw-flex-1">
          <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-neutral-100 tw-space-x-1">
            <span>Block number:</span>
            <span>{blocknumber}</span>
          </p>
        </div>
        <div className="tw-inline-flex tw-items-center tw-text-sm tw-text-neutral-100">
          <svg
            className="tw-flex-shrink-0 tw-mr-2 tw-h-4 tw-w-4 tw-text-neutral-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>
            <Countdown timestamp={timestamp} />
          </span>
        </div>
      </div>
    </div>
  );
}
