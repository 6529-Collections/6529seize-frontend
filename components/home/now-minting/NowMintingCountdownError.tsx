import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownError() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3 tw-text-left md:tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-mt-0.5 tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#C9A879]/10 tw-ring-1 tw-ring-[#C9A879]/20">
          <ExclamationTriangleIcon className="tw-size-5 tw-text-[#C9A879]" />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-[#C9A879]">
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
