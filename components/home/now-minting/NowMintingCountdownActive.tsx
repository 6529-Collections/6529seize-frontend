import type { CountdownData } from "@/hooks/useMintCountdownState";
import { usePageVisible } from "@/hooks/usePageVisibility";
import { formatCountdownVerbose } from "@/utils/timeFormatters";
import {
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { HOME_ACTION_ARROW_CLASSES } from "../homeInteractionStyles";

interface NowMintingCountdownActiveProps {
  readonly countdown: CountdownData;
  readonly variant?: "default" | "home";
}

export default function NowMintingCountdownActive({
  countdown,
  variant = "default",
}: NowMintingCountdownActiveProps) {
  if (variant === "home") {
    return (
      <HomeCountdown countdown={countdown}>
        <LiveCountdown
          targetTimestampSeconds={countdown.targetDate}
          segmented
        />
      </HomeCountdown>
    );
  }

  return (
    // Preserve the previous desktop footprint so the adjacent artwork stays the same height.
    <div
      className={
        countdown.showMintBtn
          ? "group-data-[home-drop]/home-drop:lg:tw-flex group-data-[home-drop]/home-drop:lg:tw-min-h-[190px] group-data-[home-drop]/home-drop:lg:tw-flex-col group-data-[home-drop]/home-drop:lg:tw-justify-end"
          : "group-data-[home-drop]/home-drop:lg:tw-flex group-data-[home-drop]/home-drop:lg:tw-min-h-[134px] group-data-[home-drop]/home-drop:lg:tw-flex-col group-data-[home-drop]/home-drop:lg:tw-justify-end"
      }
    >
      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900 tw-p-4 tw-text-left group-data-[home-drop]/home-drop:tw-overflow-visible group-data-[home-drop]/home-drop:tw-rounded-none group-data-[home-drop]/home-drop:tw-border-0 group-data-[home-drop]/home-drop:tw-bg-transparent group-data-[home-drop]/home-drop:tw-p-0 md:tw-p-5">
        {countdown.showAllowlistInfo && <AllowlistInfoTooltip />}
        <div className="group-data-[home-drop]/home-drop:tw-grid group-data-[home-drop]/home-drop:tw-grid-cols-1 group-data-[home-drop]/home-drop:tw-items-center group-data-[home-drop]/home-drop:tw-gap-3 group-data-[home-drop]/home-drop:tw-rounded-xl group-data-[home-drop]/home-drop:tw-border group-data-[home-drop]/home-drop:tw-border-solid group-data-[home-drop]/home-drop:tw-border-white/[0.08] group-data-[home-drop]/home-drop:tw-bg-white/[0.03] group-data-[home-drop]/home-drop:tw-px-4 group-data-[home-drop]/home-drop:tw-py-4 group-data-[home-drop]/home-drop:md:tw-px-5">
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 group-data-[home-drop]/home-drop:tw-mb-0 group-data-[home-drop]/home-drop:tw-min-w-0 group-data-[home-drop]/home-drop:tw-flex-row group-data-[home-drop]/home-drop:tw-items-start group-data-[home-drop]/home-drop:tw-gap-x-3 group-data-[home-drop]/home-drop:tw-gap-y-2">
            <span className="tw-whitespace-nowrap tw-py-0.5 tw-text-xs tw-font-semibold tw-text-iron-100 group-data-[home-drop]/home-drop:tw-min-w-0 group-data-[home-drop]/home-drop:tw-flex-1 group-data-[home-drop]/home-drop:tw-whitespace-normal group-data-[home-drop]/home-drop:tw-text-sm group-data-[home-drop]/home-drop:tw-leading-5">
              {countdown.title}
            </span>
            <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
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
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-amber-400/20 tw-bg-amber-500/10 tw-px-2 tw-py-0.5">
                  <span
                    aria-hidden="true"
                    className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-amber-400"
                  />
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

function AllowlistInfoTooltip() {
  return (
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
  );
}

function HomeCountdown({
  countdown,
  children,
}: {
  readonly countdown: CountdownData;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={`tw-flex tw-flex-col tw-justify-start ${countdown.showMintBtn ? "lg:tw-min-h-[190px]" : "lg:tw-min-h-[134px]"}`}
    >
      {countdown.showAllowlistInfo && <AllowlistInfoTooltip />}
      <div
        data-home-countdown
        className="tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 max-[360px]:tw-px-3 md:tw-px-5"
      >
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2 md:tw-items-center md:tw-gap-3">
          <div
            data-countdown-phase
            className="tw-flex tw-min-w-0 tw-flex-1 tw-basis-20 tw-items-center tw-gap-1.5"
          >
            <span className="tw-text-sm tw-font-medium tw-leading-5 tw-tracking-[-0.01em] tw-text-iron-200">
              {countdown.title}
            </span>
            {countdown.showAllowlistInfo && (
              <InformationCircleIcon
                data-tooltip-id="allowlist-info"
                data-tooltip-content="The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist."
                role="img"
                aria-hidden={false}
                aria-label="The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist."
                tabIndex={0}
                className="tw-size-4 tw-shrink-0 tw-cursor-help tw-text-iron-600 tw-transition-colors focus-visible:tw-rounded-full focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none"
              />
            )}
          </div>
          <span
            className={`tw-inline-flex tw-h-5 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-pl-[7px] tw-pr-2 ${countdown.isActive ? "tw-border-emerald-400/20 tw-bg-emerald-400/10" : "tw-border-amber-400/[0.16] tw-bg-amber-400/[0.07]"}`}
          >
            <span
              aria-hidden="true"
              className="tw-relative tw-flex tw-size-[5px]"
            >
              <span
                className={`tw-absolute tw-inset-0 tw-animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] tw-rounded-full tw-opacity-60 motion-reduce:tw-animate-none ${countdown.isActive ? "tw-bg-emerald-400" : "tw-bg-amber-400"}`}
              />
              <span
                className={`tw-relative tw-size-[5px] tw-rounded-full ${countdown.isActive ? "tw-bg-emerald-400" : "tw-bg-amber-400"}`}
              />
            </span>
            <span
              className={`tw-text-[11px] tw-font-semibold tw-leading-none tw-tracking-[0.02em] ${countdown.isActive ? "tw-text-emerald-400" : "tw-text-amber-300"}`}
            >
              {countdown.isActive ? "Live" : "Upcoming"}
            </span>
          </span>
        </div>
        <div
          data-countdown-timing
          className="tw-mt-2.5 tw-flex tw-min-h-12 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-1 tw-py-3 tw-@container/countdown md:tw-px-2.5"
        >
          {children}
        </div>
      </div>
      {countdown.showMintBtn && (
        <ButtonLink
          data-home-action="Mint"
          href="/the-memes/mint"
          size="lg"
          fullWidth
          className="tw-group/action tw-mt-2.5 tw-rounded-lg motion-reduce:tw-transition-none"
        >
          Mint
          <ArrowRightIcon
            className={HOME_ACTION_ARROW_CLASSES}
            strokeWidth={2}
          />
        </ButtonLink>
      )}
    </div>
  );
}

const LiveCountdown = memo(
  ({
    targetTimestampSeconds,
    segmented = false,
  }: {
    readonly targetTimestampSeconds: number;
    readonly segmented?: boolean;
  }) => {
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

    if (!segmented) return <span role="timer">{display}</span>;

    return (
      <span
        role="timer"
        aria-label={display}
        className="tw-flex tw-w-fit tw-max-w-full tw-flex-wrap tw-items-baseline tw-justify-center tw-gap-y-2 tw-tabular-nums [&:has(>span:nth-child(4))>span:nth-child(3)>[aria-hidden]]:tw-hidden @[11rem]/countdown:[&:has(>span:nth-child(4))>span:nth-child(3)>[aria-hidden]]:tw-inline [&:has(>span:nth-child(4))]:tw-grid [&:has(>span:nth-child(4))]:tw-grid-cols-2 @[11rem]/countdown:[&:has(>span:nth-child(4))]:tw-flex"
      >
        {display.split(" : ").map((part, index) => (
          <span
            key={part.slice(-1)}
            className="tw-inline-flex tw-items-baseline tw-whitespace-nowrap"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="tw-mx-1 tw--translate-y-0.5 tw-text-base tw-font-light tw-text-iron-650 md:tw-mx-2"
              >
                {" "}
                :{" "}
              </span>
            )}
            <span
              data-countdown-value
              className="tw-text-xl tw-font-bold tw-tabular-nums tw-leading-none tw-tracking-[-0.02em] tw-text-iron-50 md:tw-text-2xl"
            >
              {part.slice(0, -1).padStart(2, "0")}
            </span>
            <span className="tw-ml-0.5 tw-text-[13px] tw-font-semibold tw-text-iron-400 md:tw-text-sm">
              {part.slice(-1)}
            </span>
          </span>
        ))}
      </span>
    );
  }
);

LiveCountdown.displayName = "LiveCountdown";
