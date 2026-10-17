"use client";

import { useState } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  EDITION_FLOOR_THRESHOLD,
  EXAMPLE_NETWORK,
  effectiveEdition,
  isRateHalfCentTie,
  rateCents,
} from "@/lib/tdh/tdhV1Arithmetic";
import { TdhSvg } from "../../shared/TdhSvg";
import ExplorableFrame from "./ExplorableFrame";
import IntegerField from "./IntegerField";

const DEFAULT_MINTED = 149;
const DEFAULT_CLAIM = 332;
/**
 * H, the largest eligible edition of the October 11 network (FirstGM's
 * 3,941). P26 §5.2 takes H as the largest edition of every eligible Meme,
 * so no card's edition can exceed it: the minted count stops at H, and the
 * card is never larger than the network's largest edition.
 */
const H = EXAMPLE_NETWORK.largestEdition;
/** P26 §5.2: a floor is the claim's limit, capped at 310. */
const FLOOR_CAP = 310;

/**
 * The explorer's chart: the rate a Meme gets against the copies minted, for
 * the claim limit set above it. Below the 300-copy threshold a claim lifts
 * the edition to its floor (the claim limit, at most 310), so the rate runs
 * flat there, under the curve the minted count alone would give; at 300 the
 * floor ends and the rate jumps back onto the curve. Drawn twice: a phone
 * drawing and a wider one, each with text of 13 to 14 units.
 */
const CHART = {
  narrow: { width: 280, height: 236, font: 14, ticks: [100, 300, 600] },
  wide: {
    width: 480,
    height: 236,
    font: 13,
    ticks: [100, 200, 300, 400, 500, 600],
  },
} as const;
const PLOT = { left: 40, right: 14, top: 26, bottom: 46 } as const;
const MIN_MINTED = 100;
const MAX_MINTED = 600;
const MAX_RATE = 40;
const RATE_TICKS = [0, 10, 20, 30, 40] as const;

type ChartSize = keyof typeof CHART;

const rateOf = (minted: number, claim: number): number =>
  (rateCents(H, effectiveEdition(minted, claim).edition) ?? 0) / 100;

function MintedRateChart({
  locale,
  size,
  minted,
  claim,
  cents,
}: {
  readonly locale: SupportedLocale;
  readonly size: ChartSize;
  readonly minted: number;
  readonly claim: number;
  readonly cents: number;
}) {
  const { width, height, font, ticks } = CHART[size];
  const plotRight = width - PLOT.right;
  const base = height - PLOT.bottom;
  const x = (value: number) =>
    PLOT.left +
    ((Math.min(Math.max(value, MIN_MINTED), MAX_MINTED) - MIN_MINTED) /
      (MAX_MINTED - MIN_MINTED)) *
      (plotRight - PLOT.left);
  const y = (rate: number) =>
    PLOT.top +
    (1 - Math.min(Math.max(rate, 0), MAX_RATE) / MAX_RATE) * (base - PLOT.top);
  const fmtRate = (value: number) =>
    formatNumber(locale, value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  // The curve of the minted count alone, and the rate used: the same past
  // the threshold, flat on the floor below it, with a break at 300.
  const sample = (from: number, to: number, rate: (m: number) => number) =>
    Array.from({ length: 40 }, (_, index) => {
      const m = from + ((to - from) * index) / 39;
      return `${index === 0 ? "M" : "L"}${x(m).toFixed(1)},${y(rate(m)).toFixed(1)}`;
    }).join(" ");
  const alone = sample(MIN_MINTED, MAX_MINTED, (m) => H / m);
  const below = sample(MIN_MINTED, EDITION_FLOOR_THRESHOLD - 1, (m) =>
    rateOf(Math.round(m), claim)
  );
  const above = sample(EDITION_FLOOR_THRESHOLD, MAX_MINTED, (m) => H / m);
  const thresholdX = x(EDITION_FLOOR_THRESHOLD);
  const px = x(minted);
  const py = y(cents / 100);
  const lifted = effectiveEdition(minted, claim).floorApplied;
  const ghostY = y(H / minted);
  const labelRight = px < (PLOT.left + plotRight) / 2;
  const offRight = minted > MAX_MINTED;
  const label = offRight
    ? t(locale, "network.tdh.how.rate.chartOff", {
        minted: formatInteger(locale, minted),
        rate: fmtRate(cents / 100),
      })
    : fmtRate(cents / 100);
  // The rate label sits beside the dot: below it when the floor lifted the
  // edition (the minted count's point and its drop are above), else above.
  const labelX = labelRight ? px + 10 : px - 10;
  const labelY = lifted
    ? Math.min(py + font + 8, base - 4)
    : Math.min(Math.max(py - 8, PLOT.top + font), base - 6);
  return (
    <TdhSvg
      id={`rate-explorer-${size}`}
      width={width}
      height={height}
      title={t(locale, "network.tdh.how.rate.curveTitle")}
      desc={t(
        locale,
        claim > 0
          ? "network.tdh.how.rate.curveDesc"
          : "network.tdh.how.rate.curveDescNoClaim",
        {
          minted: formatInteger(locale, minted),
          edition: formatInteger(
            locale,
            effectiveEdition(minted, claim).edition
          ),
          rate: fmtRate(cents / 100),
          floor: formatInteger(locale, Math.min(claim, FLOOR_CAP)),
        }
      )}
      className="tw-mx-auto"
    >
      <text x={4} y={14} fontSize={font} className="tw-fill-iron-300">
        {t(locale, "network.tdh.how.rate.axisY")}
      </text>
      {RATE_TICKS.map((tick) => (
        <g key={tick}>
          <line
            x1={PLOT.left}
            x2={plotRight}
            y1={y(tick)}
            y2={y(tick)}
            className="tw-stroke-iron-800"
            data-tdh-grid=""
          />
          <text
            x={PLOT.left - 6}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={font}
            className="tw-fill-iron-400 tw-tabular-nums"
          >
            {formatInteger(locale, tick)}
          </text>
        </g>
      ))}
      {ticks.map((tick) => (
        <text
          key={tick}
          x={x(tick)}
          y={base + 17}
          textAnchor={tick === MAX_MINTED ? "end" : "middle"}
          fontSize={font}
          className={`tw-tabular-nums ${tick === EDITION_FLOOR_THRESHOLD ? "tw-fill-amber-200" : "tw-fill-iron-400"}`}
        >
          {formatInteger(locale, tick)}
        </text>
      ))}
      <text
        x={(PLOT.left + plotRight) / 2}
        y={height - 6}
        textAnchor="middle"
        fontSize={font}
        className="tw-fill-iron-300"
      >
        {t(locale, "network.tdh.how.rate.axisX")}
      </text>
      {/* The threshold: floors apply only below it. */}
      <line
        x1={thresholdX}
        x2={thresholdX}
        y1={PLOT.top - 4}
        y2={base}
        strokeDasharray="4 3"
        className="tw-stroke-amber-300/80"
      />
      <path
        d={alone}
        fill="none"
        strokeWidth={1.5}
        strokeDasharray="2 3"
        className="tw-stroke-iron-500"
      />
      <path
        d={below}
        fill="none"
        strokeWidth={2.5}
        className="tw-stroke-primary-300"
      />
      <path
        d={above}
        fill="none"
        strokeWidth={2.5}
        className="tw-stroke-primary-300"
      />
      {lifted && !offRight && (
        <g>
          <circle
            cx={px}
            cy={ghostY}
            r={4.5}
            fill="none"
            strokeWidth={1.5}
            className="tw-stroke-iron-400"
          />
          <line
            x1={px}
            x2={px}
            y1={ghostY + 6}
            y2={py - 7}
            strokeDasharray="3 3"
            className="tw-stroke-iron-400"
          />
        </g>
      )}
      <circle cx={px} cy={py} r={5.5} className="tw-fill-primary-300" />
      <text
        x={labelX}
        y={labelY}
        textAnchor={labelRight ? "start" : "end"}
        fontSize={font + 1}
        className="tw-fill-iron-50 tw-stroke-iron-950 tw-font-semibold tw-tabular-nums"
        strokeWidth={4}
        paintOrder="stroke"
      >
        {label}
      </text>
    </TdhSvg>
  );
}

/** The chart's key, one item a row: what each line on the chart is. */
function ChartKey({
  locale,
  floor,
}: {
  readonly locale: SupportedLocale;
  /**
   * The floor the claim sets below 300 copies, its limit capped at 310; 0
   * without a claim. The edition there is the larger of the minted count
   * and the floor, so the line runs flat only where fewer are minted.
   */
  readonly floor: number;
}) {
  const item = "tw-flex tw-items-center tw-gap-2";
  return (
    <ul className="tw-m-0 tw-mt-2 tw-grid tw-list-none tw-gap-1 tw-p-0 tw-text-[13px] tw-leading-5 tw-text-iron-300">
      <li className={item}>
        <span
          aria-hidden="true"
          className="tw-w-5 tw-shrink-0 tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-primary-300"
        />
        {floor > 0
          ? t(locale, "network.tdh.how.rate.keyUsedFloor", {
              floor: formatInteger(locale, floor),
            })
          : t(locale, "network.tdh.how.rate.keyUsed")}
      </li>
      <li className={item}>
        <span
          aria-hidden="true"
          className="tw-w-5 tw-shrink-0 tw-border-0 tw-border-t-2 tw-border-dotted tw-border-iron-500"
        />
        {t(locale, "network.tdh.how.rate.keyAlone")}
      </li>
      <li className={item}>
        <span
          aria-hidden="true"
          className="tw-h-4 tw-w-5 tw-shrink-0 tw-border-0 tw-border-l-2 tw-border-dashed tw-border-amber-300/80"
        />
        {t(locale, "network.tdh.how.rate.keyThreshold")}
      </li>
    </ul>
  );
}

/** Steps 6 and 7: from minted copies and a claim limit to the card's rate. */
export default function RateExplorer({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [minted, setMinted] = useState(DEFAULT_MINTED);
  const [claim, setClaim] = useState(DEFAULT_CLAIM);
  const { edition, floorApplied } = effectiveEdition(minted, claim);
  const cents = rateCents(H, edition) ?? 0;
  const tie = isRateHalfCentTie(H, edition);
  const rate = formatNumber(locale, cents / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let note: string;
  if (minted >= H) {
    note = `${t(locale, "network.tdh.how.rate.thresholdNote")} ${t(
      locale,
      "network.tdh.how.rate.largestNote"
    )}`;
  } else if (minted >= EDITION_FLOOR_THRESHOLD) {
    note = t(locale, "network.tdh.how.rate.thresholdNote");
  } else if (floorApplied) {
    note = t(locale, "network.tdh.how.rate.floorNote", {
      minted: formatInteger(locale, minted),
      edition: formatInteger(locale, edition),
    });
  } else if (claim > 0) {
    note = t(locale, "network.tdh.how.rate.claimBelowNote");
  } else {
    note = t(locale, "network.tdh.how.rate.noFloorNote");
  }

  const label = (key: "minted" | "claim") =>
    t(locale, `network.tdh.how.rate.${key}`);

  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.rate.title")}
      onReset={() => {
        setMinted(DEFAULT_MINTED);
        setClaim(DEFAULT_CLAIM);
      }}
    >
      {/* Controls and figures beside the chart once the frame is wide
          enough, so the panel never leaves a band of empty card. */}
      <div className="tw-@container">
        <div className="tw-grid tw-gap-5 @[44rem]:tw-grid-cols-[minmax(0,18rem)_minmax(0,1fr)] @[44rem]:tw-items-start">
          <div>
            <div className="tw-grid tw-gap-4 @[26rem]:tw-grid-cols-2 @[44rem]:tw-grid-cols-1">
              <IntegerField
                label={label("minted")}
                value={minted}
                min={1}
                max={H}
                onChange={setMinted}
                increaseLabel={t(locale, "network.tdh.shared.increase", {
                  name: label("minted"),
                })}
                decreaseLabel={t(locale, "network.tdh.shared.decrease", {
                  name: label("minted"),
                })}
              />
              <IntegerField
                label={label("claim")}
                value={claim}
                min={0}
                max={400}
                onChange={setClaim}
                increaseLabel={t(locale, "network.tdh.shared.increase", {
                  name: label("claim"),
                })}
                decreaseLabel={t(locale, "network.tdh.shared.decrease", {
                  name: label("claim"),
                })}
              />
            </div>
            <output aria-live="polite" className="tw-mt-4 tw-block">
              <dl className="tw-m-0 tw-grid tw-grid-cols-3 tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-center">
                <div className="tw-flex tw-flex-col tw-justify-between">
                  <dt className="tw-text-[13px] tw-leading-5 tw-text-iron-400">
                    {t(locale, "network.tdh.how.rate.edition")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
                    {formatInteger(locale, edition)}
                  </dd>
                </div>
                <div className="tw-flex tw-flex-col tw-justify-between">
                  <dt className="tw-text-[13px] tw-leading-5 tw-text-iron-400">
                    {t(locale, "network.tdh.how.rate.exact")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
                    {formatNumber(locale, H / edition, {
                      maximumFractionDigits: 2,
                    })}
                  </dd>
                </div>
                <div className="tw-flex tw-flex-col tw-justify-between">
                  <dt className="tw-text-[13px] tw-leading-5 tw-text-iron-400">
                    {t(locale, "network.tdh.how.rate.rounded")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-primary-300">
                    {rate}
                  </dd>
                </div>
              </dl>
              <span className="tw-mt-2 tw-block tw-min-h-[3rem] tw-text-sm tw-leading-6 tw-text-iron-300">
                {note} {tie && t(locale, "network.tdh.how.rate.tieNote")}
              </span>
              <span className="tw-sr-only">
                {t(locale, "network.tdh.how.rate.result", {
                  edition: formatInteger(locale, edition),
                  rate,
                })}
              </span>
            </output>
          </div>
          <figure className="tw-m-0" aria-hidden="true">
            <div className="tw-@container">
              <div className="@[30rem]:tw-hidden">
                <MintedRateChart
                  locale={locale}
                  size="narrow"
                  minted={minted}
                  claim={claim}
                  cents={cents}
                />
              </div>
              <div className="tw-hidden @[30rem]:tw-block">
                <MintedRateChart
                  locale={locale}
                  size="wide"
                  minted={minted}
                  claim={claim}
                  cents={cents}
                />
              </div>
            </div>
            <ChartKey
              locale={locale}
              floor={claim > 0 ? Math.min(claim, FLOOR_CAP) : 0}
            />
          </figure>
        </div>
      </div>
    </ExplorableFrame>
  );
}
