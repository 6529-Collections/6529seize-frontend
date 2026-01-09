export default function NowMintingCountdownError() {
  return (
    <>
      <span className="tw-text-red-400 tw-text-xs tw-uppercase tw-tracking-wider">
        Error loading mint
      </span>
      <div className="tw-my-2 tw-text-3xl tw-font-bold tw-text-iron-50">
        --:--:--
      </div>
      <div className="tw-h-12" />
    </>
  );
}
