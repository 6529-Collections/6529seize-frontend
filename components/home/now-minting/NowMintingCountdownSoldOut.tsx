import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function NowMintingCountdownSoldOut({
  showThankYou,
}: {
  readonly showThankYou: boolean;
}) {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3 tw-text-left tw-backdrop-blur-sm md:tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <span className="tw-mt-0.5 tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-900/60 tw-ring-1 tw-ring-white/10">
          <CheckCircleIcon className="tw-size-4.5 tw-flex-shrink-0 tw-text-emerald-300/80" />
        </span>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <span className="tw-text-sm tw-font-semibold tw-text-emerald-400">
            Mint complete
          </span>
          <span className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
            All NFTs have been successfully minted.
          </span>
          {showThankYou && (
            <span className="tw-text-xs tw-text-iron-500">
              Thank you for participating.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
