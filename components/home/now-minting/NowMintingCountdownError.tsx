export default function NowMintingCountdownError() {
  return (
    <>
      <span className="tw-text-red-400 tw-text-xs tw-uppercase tw-tracking-wider">
        Error
      </span>
      <div className="tw-my-2 tw-text-xl tw-font-medium tw-text-iron-300">
        Failed to load mint data
      </div>
      <button className="tw-h-12 tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-800 tw-font-semibold tw-text-iron-300 tw-transition-colors hover:tw-bg-iron-700">
        Retry
      </button>
    </>
  );
}
