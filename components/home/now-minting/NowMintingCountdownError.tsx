import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownError() {
  return (
    <>
      <div className="tw-flex tw-flex-col">
        <div className="tw-flex tw-flex-col tw-text-base tw-font-normal tw-leading-relaxed tw-text-amber-400">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <ExclamationTriangleIcon
              className="tw-size-4 tw-text-amber-400"
              aria-hidden
            />
            Error fetching mint information
          </div>
          <span className="tw-mt-1 tw-text-sm tw-font-medium tw-text-iron-500">
            Please try again later
          </span>
        </div>
      </div>
    </>
  );
}
