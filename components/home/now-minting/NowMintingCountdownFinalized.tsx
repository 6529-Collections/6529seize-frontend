import ClockIcon from "@/components/utils/icons/ClockIcon";

export default function NowMintingCountdownFinalized() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-black/40 tw-p-4 md:tw-p-5 tw-text-left tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-6 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-white/0 tw-via-white/12 tw-to-white/0" />
      <div className="tw-flex tw-items-start tw-gap-4">
        <div className="tw-mt-0.5 tw-flex tw-h-9 tw-w-9 md:tw-h-10 md:tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/5 tw-ring-1 tw-ring-white/10">
          <ClockIcon className="tw-h-5 tw-w-5 tw-text-iron-300" />
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
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
