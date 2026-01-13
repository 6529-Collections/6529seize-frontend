import { LockClosedIcon as Lock } from "@heroicons/react/24/outline";

export default function NowMintingCountdownFinalized() {
  return (
    <>
      <div className="tw-flex tw-flex-col tw-gap-6">
        <div className="tw-flex tw-flex-col tw-text-base tw-font-normal tw-leading-relaxed tw-text-iron-200">
          <span>This mint phase has ended</span>
          <span className="tw-mt-1 tw-text-sm tw-font-medium tw-text-iron-500">
            Thank you for participating!
          </span>
        </div>
        <button
          disabled
          className="tw-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 tw-cursor-not-allowed tw-opacity-80"
        >
          <Lock className="tw-size-4 tw-text-[#848490]" aria-hidden />
          <span className="tw-text-sm tw-font-bold tw-text-[#93939F]">
            Mint Ended
          </span>
        </button>
      </div>
    </>
  );
}
