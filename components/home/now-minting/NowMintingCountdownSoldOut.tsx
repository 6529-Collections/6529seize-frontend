export default function NowMintingCountdownSoldOut() {
  return (
    <>
      <span className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-yellow-500">
        Sold Out
      </span>
      <div className="tw-my-2 tw-text-xl tw-font-medium tw-text-iron-300">
        All editions claimed
      </div>
      <button
        disabled
        className="tw-h-12 tw-w-full tw-cursor-not-allowed tw-rounded-lg tw-bg-iron-800 tw-font-semibold tw-text-iron-500"
      >
        Sold Out
      </button>
    </>
  );
}
