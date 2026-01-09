import { useCountdownAdaptive } from "@/hooks/useCountdown";
import type { CountdownData } from "@/hooks/useMintCountdownState";
import Link from "next/link";

interface NowMintingCountdownActiveProps {
  readonly countdown: CountdownData;
}

export default function NowMintingCountdownActive({
  countdown,
}: NowMintingCountdownActiveProps) {
  const display = useCountdownAdaptive(countdown.targetDate);

  return (
    <>
      <span className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-iron-400">
        {countdown.title}
      </span>
      <div className="tw-my-2 tw-text-3xl tw-font-bold tw-text-iron-50">
        {display}
      </div>
      {countdown.showMintBtn ? (
        <Link href="/the-memes/mint">
          <button className="tw-h-12 tw-w-full tw-rounded-lg tw-bg-primary-500 tw-font-semibold tw-text-white tw-transition-opacity hover:tw-opacity-90">
            Mint
          </button>
        </Link>
      ) : (
        <div className="tw-h-12" />
      )}
    </>
  );
}
