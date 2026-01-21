import type { CountdownData } from "@/hooks/useMintCountdownState";
import { formatCountdownVerbose } from "@/utils/timeFormatters";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";

interface NowMintingCountdownActiveProps {
  readonly countdown: CountdownData;
}

export default function NowMintingCountdownActive({
  countdown,
}: NowMintingCountdownActiveProps) {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-p-3 tw-text-left md:tw-p-4">
      <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
        <span className="tw-text-xs tw-font-semibold tw-text-iron-300">
          {countdown.title}
        </span>
        {countdown.isActive && (
          <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-success/20 tw-bg-success/10 tw-px-2 tw-py-0.5">
            <span className="tw-relative tw-flex tw-h-2 tw-w-2">
              <span className="tw-absolute tw-inline-flex tw-h-full tw-w-full tw-animate-ping tw-rounded-full tw-bg-success/60" />
              <span className="tw-relative tw-inline-flex tw-h-2 tw-w-2 tw-rounded-full tw-bg-success" />
            </span>
            <span className="tw-text-[10px] tw-font-semibold tw-text-success/80">
              Live
            </span>
          </div>
        )}
      </div>
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-white/5 tw-bg-iron-950/80 tw-p-3 tw-shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
        <div className="tw-text-xl tw-font-bold tw-tabular-nums tw-text-iron-50 md:tw-text-2xl">
          <LiveCountdown targetTimestampSeconds={countdown.targetDate} />
        </div>
      </div>

      {countdown.showMintBtn && (
        <Link
          href="/the-memes/mint"
          className="tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset desktop-hover:hover:tw-bg-iron-300 desktop-hover:hover:tw-text-iron-950 desktop-hover:hover:tw-ring-iron-300"
        >
          Mint
          <ArrowRightIcon
            className="tw-size-4 tw-flex-shrink-0"
            strokeWidth={2}
          />
        </Link>
      )}
    </div>
  );
}

const LiveCountdown = memo(
  ({ targetTimestampSeconds }: { readonly targetTimestampSeconds: number }) => {
    const [display, setDisplay] = useState(() =>
      formatCountdownVerbose(targetTimestampSeconds)
    );
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      const targetMs = targetTimestampSeconds * 1000;

      const tick = () => {
        setDisplay(formatCountdownVerbose(targetTimestampSeconds));

        if (Date.now() >= targetMs) {
          return;
        }

        const now = Date.now();
        const msUntilNextSecond = 1000 - (now % 1000);
        timerRef.current = setTimeout(tick, msUntilNextSecond);
      };

      tick();

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = null;
      };
    }, [targetTimestampSeconds]);

    return <span>{display}</span>;
  }
);

LiveCountdown.displayName = "LiveCountdown";
