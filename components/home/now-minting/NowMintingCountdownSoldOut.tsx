import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownSoldOut() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3 tw-text-left md:tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <span className="tw-mt-0.5 tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-success/10 tw-ring-1 tw-ring-success/20">
          <CheckCircleIcon className="tw-size-5 tw-text-success/80 tw-flex-shrink-0" />
        </span>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <span className="tw-text-sm tw-font-semibold tw-text-success">
            Mint complete
          </span>
          <span className="tw-text-sm tw-leading-relaxed tw-text-iron-100">
            All NFTs have been successfully minted.
          </span>
          <span className="tw-text-xs tw-text-iron-400">
            Thank you for participating.
          </span>
        </div>
      </div>
    </div>
  );
}
