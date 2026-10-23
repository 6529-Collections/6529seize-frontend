import type { CountdownData } from "@/hooks/useMintCountdownState";
import { usePageVisible } from "@/hooks/usePageVisibility";
import { formatCountdownVerbose } from "@/utils/timeFormatters";
import {
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { memo, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { HOME_ACTION_ARROW_CLASSES } from "../homeInteractionStyles";

interface NowMintingCountdownActiveProps {
  readonly countdown: CountdownData;
}

export default function NowMintingCountdownActive({
  countdown,
}: NowMintingCountdownActiveProps) {
  return (
    // Preserve the previous desktop footprint so the adjacent artwork stays the same height.
    <div
      className={
        countdown.showMintBtn
          ? "group-data-[home-drop]/home-drop:lg:tw-min-h-[190px]"
          : "group-data-[home-drop]/home-drop:lg:tw-min-h-[134px]"
      }
    >
      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-p-4 tw-text-left group-data-[home-drop]/home-drop:tw-overflow-visible group-data-[home-drop]/home-drop:tw-rounded-none group-data-[home-drop]/home-drop:tw-border-0 group-data-[home-drop]/home-drop:tw-bg-transparent group-data-[home-drop]/home-drop:tw-p-0 md:tw-p-5">
        {countdown.showAllowlistInfo && (
          <Tooltip
            id="allowlist-info"
            place="left"
            border="1px solid rgba(255, 255, 255, 0.15)"
            opacity={1}
            style={{
              backgroundColor: "#26272B",
              color: "white",
              padding: "10px 14px",
              maxWidth: "250px",
              fontSize: "14px",
              lineHeight: "1.4",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
              borderRadius: "6px",
            }}
          />
        )}
        <div className="group-data-[home-drop]/home-drop:tw-grid group-data-[home-drop]/home-drop:tw-grid-cols-[minmax(6.5rem,1fr)_minmax(0,1.65fr)] group-data-[home-drop]/home-drop:tw-items-center group-data-[home-drop]/home-drop:tw-gap-3 group-data-[home-drop]/home-drop:tw-rounded-xl group-data-[home-drop]/home-drop:tw-border group-data-[home-drop]/home-drop:tw-border-solid group-data-[home-drop]/home-drop:tw-border-white/[0.08] group-data-[home-drop]/home-drop:tw-bg-white/[0.03] group-data-[home-drop]/home-drop:tw-px-4 group-data-[home-drop]/home-drop:tw-py-3 group-data-[home-drop]/home-drop:md:tw-px-5">
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 group-data-[home-drop]/home-drop:tw-mb-0 group-data-[home-drop]/home-drop:tw-min-w-0 group-data-[home-drop]/home-drop:tw-flex-col group-data-[home-drop]/home-drop:tw-items-start group-data-[home-drop]/home-drop:tw-gap-1">
            <span className="tw-whitespace-nowrap tw-py-0.5 tw-text-xs tw-font-semibold tw-text-iron-100 group-data-[home-drop]/home-drop:tw-whitespace-normal">
              {countdown.title}
            </span>
            <div className="tw-flex tw-items-center tw-gap-2">
              {countdown.showAllowlistInfo && (
                <InformationCircleIcon
                  data-tooltip-id="allowlist-info"
                  data-tooltip-content="The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist."
                  className="tw-size-5 tw-cursor-help tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none"
                />
              )}
              {countdown.isActive ? (
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-success/20 tw-bg-success/10 tw-px-2 tw-py-0.5">
                  <span className="tw-relative tw-flex tw-h-2 tw-w-2">
                    <span className="tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-success/60 motion-safe:tw-animate-ping" />
                    <span className="tw-relative tw-inline-flex tw-h-2 tw-w-2 tw-rounded-full tw-bg-success" />
                  </span>
                  <span className="tw-text-[10px] tw-font-semibold tw-text-success/80">
                    Live
                  </span>
                </div>
              ) : (
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-transparent tw-bg-amber-500/10 tw-px-2 tw-py-0.5">
                  <span className="tw-text-[11px] tw-font-semibold tw-text-amber-400">
                    Upcoming
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="tw-flex tw-h-14 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-black/30 tw-shadow-none group-data-[home-drop]/home-drop:tw-h-auto group-data-[home-drop]/home-drop:tw-min-w-0 group-data-[home-drop]/home-drop:tw-justify-end group-data-[home-drop]/home-drop:tw-self-center group-data-[home-drop]/home-drop:tw-border-0 group-data-[home-drop]/home-drop:tw-bg-transparent group-data-[home-drop]/home-drop:tw-text-right">
            <div className="tw-text-xl tw-font-bold tw-tabular-nums tw-text-iron-50 md:tw-text-2xl">
              <LiveCountdown targetTimestampSeconds={countdown.targetDate} />
            </div>
          </div>
        </div>

        {countdown.showMintBtn && (
          <ButtonLink
            data-home-action="Mint"
            href="/the-memes/mint"
            size="lg"
            fullWidth
            className="tw-group/action tw-mt-3 motion-reduce:tw-transition-none"
          >
            Mint
            <ArrowRightIcon
              className={HOME_ACTION_ARROW_CLASSES}
              strokeWidth={2}
            />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

const LiveCountdown = memo(
  ({ targetTimestampSeconds }: { readonly targetTimestampSeconds: number }) => {
    const [display, setDisplay] = useState(() =>
      formatCountdownVerbose(targetTimestampSeconds)
    );
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPageVisible = usePageVisible();

    useEffect(() => {
      // Hidden pages do not tick; showing the page again catches up at once.
      if (!isPageVisible) {
        return;
      }

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
    }, [isPageVisible, targetTimestampSeconds]);

    return <span role="timer">{display}</span>;
  }
);

LiveCountdown.displayName = "LiveCountdown";
