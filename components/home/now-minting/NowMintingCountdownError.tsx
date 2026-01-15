import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownError() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-black/40 tw-p-4 md:tw-p-5 tw-text-left tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-6 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-white/0 tw-via-[#C9A879]/25 tw-to-white/0" />
      <div className="tw-flex tw-items-start tw-gap-4">
        <div className="tw-mt-0.5 tw-flex tw-h-9 tw-w-9 md:tw-h-10 md:tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#C9A879]/10 tw-ring-1 tw-ring-[#C9A879]/20">
          <ExclamationTriangleIcon className="tw-size-5 tw-text-[#C9A879]" />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-base tw-font-semibold tw-text-[#C9A879]">
            Error fetching mint information
          </span>
          <span className="tw-text-sm tw-leading-relaxed tw-text-iron-100">
            Please try again later.
          </span>
        </div>
      </div>
    </div>
  );
}
