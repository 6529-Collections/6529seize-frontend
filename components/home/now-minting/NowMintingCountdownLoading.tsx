export default function NowMintingCountdownLoading() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3 tw-text-left md:tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-2">
        <div className="tw-h-3 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-700/70" />
        <div className="tw-h-7 tw-w-44 tw-animate-pulse tw-rounded tw-bg-iron-700/70" />
        <div className="tw-h-10 tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-700/70" />
      </div>
    </div>
  );
}
