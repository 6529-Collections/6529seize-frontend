import { LockClosedIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownSoldOut() {
  return (
    <>
      <div className="tw-flex tw-flex-col tw-gap-6">
        <div className="tw-space-y-3">
          <div className="tw-mb-1 tw-text-[11px] tw-leading-4 tw-font-bold tw-uppercase tw-tracking-wider tw-text-emerald-500/90">
            Mint Complete
          </div>
          <div className="tw-flex tw-flex-col tw-text-base tw-font-normal tw-leading-relaxed tw-text-iron-200">
            <span>All NFTs have been successfully minted.</span>
            <span className="tw-mt-1 tw-text-sm tw-font-medium tw-text-iron-500">
              Thank you for participating!
            </span>
          </div>
        </div>
        <button
          disabled
          className="tw-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 tw-cursor-not-allowed tw-opacity-80"
        >
          <LockClosedIcon className="tw-size-4 tw-text-iron-500" aria-hidden />
          <span className="tw-text-sm tw-font-bold tw-text-iron-400">
            Sold Out
          </span>
        </button>
      </div>
    </>
  );
}
