import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownError() {
  return (
    <>
      <div className="tw-flex tw-items-start tw-gap-2 tw-py-2">
        <ExclamationTriangleIcon className="tw-mt-[1px] tw-size-5 tw-flex-shrink-0 tw-text-amber-500" />
        <div>
          <p className="tw-text-sm tw-font-medium tw-text-amber-400">
            Unable to load mint information
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-500">
            Please refresh or try again later
          </p>
        </div>
      </div>
    </>
  );
}
