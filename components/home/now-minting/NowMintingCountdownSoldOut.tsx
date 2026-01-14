import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownSoldOut() {
  return (
    <>
      <div className="tw-py-2 tw-text-center">
        <div className="tw-mb-3 tw-inline-flex tw-items-center tw-gap-2">
          <CheckCircleIcon className="tw-size-5 tw-text-emerald-500" />
          <span className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wider tw-text-emerald-500">
            Mint Complete
          </span>
        </div>
        <p className="tw-mb-1 tw-text-base tw-font-medium tw-text-iron-100">
          All NFTs have been successfully minted.
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
          Thank you for participating!
        </p>
      </div>
    </>
  );
}
