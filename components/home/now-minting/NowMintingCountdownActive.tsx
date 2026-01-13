import { useCountdownVerbose } from "@/hooks/useCountdown";
import type { CountdownData } from "@/hooks/useMintCountdownState";
import Link from "next/link";

interface NowMintingCountdownActiveProps {
  readonly countdown: CountdownData;
}

export default function NowMintingCountdownActive({
  countdown,
}: NowMintingCountdownActiveProps) {
  const display = useCountdownVerbose(countdown.targetDate);

  return (
    <>
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
        <span className="tw-text-[11px] tw-font-bold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-400">
          {countdown.title}
        </span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-relative tw-flex tw-h-2 tw-w-2">
            <span className="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-emerald-400 tw-opacity-75"></span>
            <span className="tw-relative tw-inline-flex tw-rounded-full tw-h-2 tw-w-2 tw-bg-emerald-500"></span>
          </span>
          <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-emerald-500">
            Live
          </span>
        </div>
      </div>
      <div className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-rounded tw-border tw-border-white/5 tw-bg-black/40 tw-p-4 tw-shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <div className="tw-text-2xl tw-font-bold tw-text-iron-50">
          {display}
        </div>
      </div>

      {countdown.showMintBtn ? (
        <Link
          href="/the-memes/mint"
          className="tw-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-3.5 tw-py-2.5 tw-text-base tw-font-semibold tw-text-iron-950 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset desktop-hover:hover:tw-bg-iron-300 desktop-hover:hover:tw-text-iron-950 desktop-hover:hover:tw-ring-iron-300"
        >
          Mint
        </Link>
      ) : (
        <div className="tw-h-12" />
      )}
    </>
  );
}
