export default function NowMintingCountdownActive() {
  return (
    <>
      <span className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-iron-400">
        Countdown
      </span>
      <div className="tw-my-2 tw-text-3xl tw-font-bold tw-text-iron-50">
        00:00:00
      </div>
      <button className="tw-h-12 tw-w-full tw-rounded-lg tw-bg-primary-500 tw-font-semibold tw-text-white tw-transition-opacity hover:tw-opacity-90">
        Mint
      </button>
    </>
  );
}
