export default function NowMintingCountdownLoading() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900/60 tw-p-4 tw-text-left md:tw-p-5">
      <div className="tw-mb-4 tw-py-0.5">
        <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-700/70 motion-safe:tw-animate-pulse" />
      </div>
      <div className="tw-h-14 tw-w-full tw-rounded-lg tw-bg-iron-700/70 motion-safe:tw-animate-pulse" />
      <div className="tw-mt-3 tw-h-11 tw-w-full tw-rounded-lg tw-bg-iron-700/70 motion-safe:tw-animate-pulse" />
    </div>
  );
}
