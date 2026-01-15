export default function NowMintingCountdownLoading() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-black/40 tw-p-4 md:tw-p-5 tw-text-left tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
      <div className="tw-pointer-events-none tw-absolute tw-inset-x-6 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-white/0 tw-via-white/10 tw-to-white/0" />
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-h-3 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700/70" />
        <div className="tw-h-8 tw-w-44 tw-animate-pulse tw-rounded tw-bg-iron-700/70" />
        <div className="tw-h-12 tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-700/70" />
      </div>
    </div>
  );
}
