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
        <Link
          href="/the-memes/mint"
          className="tw-inline-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-bg-white tw-font-semibold tw-text-iron-900 tw-transition-colors hover:tw-bg-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/40"
        >
          Mint
        </Link>
      ) : (
        <div className="tw-h-12" />
      )}
    </>
  );
}
