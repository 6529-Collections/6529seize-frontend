import ClockIcon from "@/components/utils/icons/ClockIcon";

export default function NowMintingCountdownFinalized() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3 tw-text-left md:tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <div className="tw-mt-0.5 tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/5 tw-ring-1 tw-ring-white/10">
          <ClockIcon className="tw-h-5 tw-w-5 tw-text-iron-300" />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            Mint phase complete
          </p>
          <p className="tw-mb-0 tw-text-sm tw-leading-relaxed tw-text-iron-400">
            This mint phase has ended.
          </p>
          <p className="tw-mb-0 tw-text-xs tw-text-iron-500">
            Thank you for participating!
          </p>
        </div>
      </div>
    </div>
  );
}
