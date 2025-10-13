import { useMemo } from "react";

import { InfoTooltip } from "./InfoTooltip";
import { GrowthPathTrack } from "./GrowthPathTrack";
import { OVERVIEW_CARD_CLASS } from "./constants";
import type { NetworkStats } from "./types";
import {
  extractCountdownLabel,
  formatLastUpdatedLabel,
  formatMultiplierDisplay,
} from "./utils";

interface CurrentMultiplierCardProps {
  readonly multiplier: NetworkStats["multiplier"];
  readonly lastUpdatedAt?: string | null;
}

export function CurrentMultiplierCard({
  multiplier,
  lastUpdatedAt = null,
}: Readonly<CurrentMultiplierCardProps>) {
  const currentDisplay = formatMultiplierDisplay(multiplier.current);
  const currentPercent = `${Math.round(multiplier.current * 100)}% of Base TDH`;
  const nextDisplay = formatMultiplierDisplay(multiplier.nextValue);
  const nextPercent = `${Math.round(multiplier.nextValue * 100)}% of Base TDH`;
  const countdownLabel = useMemo(
    () => extractCountdownLabel(multiplier.nextIncreaseDate),
    [multiplier.nextIncreaseDate]
  );
  const updateLabel = useMemo(
    () => formatLastUpdatedLabel(lastUpdatedAt),
    [lastUpdatedAt]
  );
  const deltaMultiplier = multiplier.nextValue - multiplier.current;
  const deltaLabel =
    Number.isFinite(deltaMultiplier) && Math.abs(deltaMultiplier) >= 0.005
      ? `${deltaMultiplier > 0 ? "+" : ""}${deltaMultiplier.toFixed(2)}×`
      : null;

  return (
    <section
      className={`${OVERVIEW_CARD_CLASS} tw-border-primary-500/60 tw-shadow-inner tw-shadow-primary-900/10 !tw-p-4 md:!tw-p-5`}
      role="region"
      aria-label="Multiplier trajectory"
    >
      <div className="tw-flex tw-h-full tw-flex-col tw-gap-3">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-1">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-200">
              Current → Next Multiplier
            </p>
            {updateLabel ? (
              <p className="tw-m-0 tw-text-[11px] tw-font-medium tw-text-iron-300">
                {updateLabel}
              </p>
            ) : null}
          </div>
          <InfoTooltip
            ariaLabel="Explain the multiplier trajectory"
            tooltip={
              <div className="tw-space-y-2 tw-text-left">
                <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                  Tracking multiplier momentum
                </p>
                <p className="tw-m-0 tw-text-xs tw-text-iron-200">
                  Your active multiplier shapes how much xTDH you can deploy today and what will unlock next.
                </p>
                <ul className="tw-m-0 tw-list-disc tw-space-y-1 tw-pl-4 tw-text-xs tw-text-iron-200">
                  <li>Current: {currentDisplay} ({currentPercent})</li>
                  <li>Scheduled: {nextDisplay} ({nextPercent})</li>
                  <li>Next update: {multiplier.nextIncreaseDate}</li>
                </ul>
              </div>
            }
          />
        </div>

        <div className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-center md:tw-gap-5">
          <div className="tw-flex tw-min-w-[140px] tw-flex-col tw-gap-1">
            <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-200">
              Now
            </p>
            <p className="tw-m-0 tw-text-4xl tw-font-semibold tw-text-primary-100">
              {currentDisplay}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-primary-100">{currentPercent}</p>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2 md:tw-gap-3" aria-hidden="true">
            <span className="tw-inline-flex tw-h-px tw-w-10 tw-bg-primary-700/40" />
            <span className="tw-text-base tw-font-semibold tw-text-primary-200">→</span>
            <span className="tw-inline-flex tw-h-px tw-w-10 tw-bg-primary-700/40" />
          </div>

          <div className="tw-flex tw-flex-col tw-gap-2">
            <div className="tw-flex tw-items-center tw-gap-2">
              <p className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-200">
                Scheduled
              </p>
              {countdownLabel ? (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/15 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-text-primary-200">
                  {countdownLabel}
                </span>
              ) : null}
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
                {nextDisplay}
              </p>
              <p className="tw-m-0 tw-text-xs tw-text-iron-300">{nextPercent}</p>
            </div>
          </div>
        </div>

        <GrowthPathTrack milestones={multiplier.milestones} />

        <div className="tw-mt-auto tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-[11px] tw-font-medium tw-text-primary-100">
          <span>Next increase: {multiplier.nextIncreaseDate}</span>
          {deltaLabel ? (
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-text-primary-200">
              {deltaLabel}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
