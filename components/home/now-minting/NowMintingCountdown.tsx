interface NowMintingCountdownProps {
  readonly phaseLabel: string;
}

export default function NowMintingCountdown({
  phaseLabel,
}: NowMintingCountdownProps) {
  return (
    <div className="tw-mt-auto tw-border-t tw-border-iron-800 tw-pt-4">
      <span className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-iron-400">
        {phaseLabel} ends in
      </span>
      <div className="tw-my-2 tw-text-3xl tw-font-bold tw-text-iron-50">
        --:--:--
      </div>
      <button className="tw-w-full tw-rounded-lg tw-bg-primary-500 tw-py-3 tw-font-semibold tw-text-white tw-transition-opacity hover:tw-opacity-90">
        Mint
      </button>
    </div>
  );
}
