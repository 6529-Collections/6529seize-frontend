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
import { NARROW_WIDTH, TdhSvg } from "../../shared/TdhSvg";
import ExplorableFrame from "./ExplorableFrame";
import IntegerField from "./IntegerField";

const DEFAULT_MINTED = 149;
const DEFAULT_CLAIM = 332;
const H = EXAMPLE_NETWORK.largestEdition;

/** The explorer's own rate curve: the edition's point moves as it changes. */
const CURVE = {
  width: NARROW_WIDTH,
  height: 132,
  left: 34,
  right: 14,
  top: 16,
  bottom: 28,
  minEdition: 50,
  maxEdition: 5_000,
  maxRate: 80,
} as const;

function curveX(edition: number): number {
  const span = Math.log10(CURVE.maxEdition) - Math.log10(CURVE.minEdition);
  const clamped = Math.min(
    Math.max(edition, CURVE.minEdition),
    CURVE.maxEdition
  );
  return (
    CURVE.left +
    ((Math.log10(clamped) - Math.log10(CURVE.minEdition)) / span) *
      (CURVE.width - CURVE.left - CURVE.right)
  );
}

function curveY(rate: number): number {
  const clamped = Math.min(Math.max(rate, 0), CURVE.maxRate);
  return (
    CURVE.top +
    (1 - clamped / CURVE.maxRate) * (CURVE.height - CURVE.top - CURVE.bottom)
  );
}

/**
 * The rate curve of step 7, with the explorer's edition on it: change the
 * copies minted or the claim limit and the point moves along the curve.
 */
function LiveRateCurve({
  locale,
  edition,
  cents,
}: {
  readonly locale: SupportedLocale;
  readonly edition: number;
  readonly cents: number;
}) {
  const path = Array.from({ length: 49 }, (_, index) => {
    const log =
      Math.log10(CURVE.minEdition) +
      ((Math.log10(CURVE.maxEdition) - Math.log10(CURVE.minEdition)) * index) /
        48;
    const e = 10 ** log;
    return `${index === 0 ? "M" : "L"}${curveX(e).toFixed(1)},${curveY(H / e).toFixed(1)}`;
  }).join(" ");
  const px = curveX(edition);
  const py = curveY(cents / 100);
  const base = CURVE.height - CURVE.bottom;
  const rate = formatNumber(locale, cents / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const labelRight = px < CURVE.width / 2;
  return (
    <TdhSvg
      id="rate-explorer-curve"
      width={CURVE.width}
      height={CURVE.height}
      title={t(locale, "network.tdh.how.rate.curveTitle")}
      desc={t(locale, "network.tdh.how.rate.curveDesc", {
        edition: formatInteger(locale, edition),
        rate,
      })}
      maxWidth={420}
      className="tw-mx-auto"
    >
      <line
        x1={CURVE.left}
        x2={CURVE.width - CURVE.right}
        y1={base}
        y2={base}
        className="tw-stroke-iron-700"
      />
      <path
        d={path}
        fill="none"
        strokeWidth={2}
        className="tw-stroke-iron-400"
      />
      <line
        x1={px}
        x2={px}
        y1={py}
        y2={base}
        strokeDasharray="3 3"
        className="tw-stroke-primary-400/70"
      />
      <circle cx={px} cy={py} r={5} className="tw-fill-primary-300" />
      <text
        x={labelRight ? px + 9 : px - 9}
        y={Math.max(py - 6, CURVE.top + 12)}
        textAnchor={labelRight ? "start" : "end"}
        fontSize={14}
        className="tw-fill-iron-50 tw-stroke-iron-950 tw-font-semibold tw-tabular-nums"
        strokeWidth={4}
        paintOrder="stroke"
      >
        {rate}
      </text>
      <text
        x={CURVE.left}
        y={CURVE.height - 8}
        fontSize={14}
        className="tw-fill-iron-400 tw-tabular-nums"
      >
        {formatInteger(locale, CURVE.minEdition)}
      </text>
      <text
        x={CURVE.width - CURVE.right}
        y={CURVE.height - 8}
        textAnchor="end"
        fontSize={14}
        className="tw-fill-iron-400 tw-tabular-nums"
      >
        {formatInteger(locale, CURVE.maxEdition)}
      </text>
    </TdhSvg>
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
  if (minted >= EDITION_FLOOR_THRESHOLD) {
    note = t(locale, "network.tdh.how.rate.thresholdNote");
  } else if (floorApplied) {
    note = t(locale, "network.tdh.how.rate.floorNote");
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
      <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <IntegerField
          label={label("minted")}
          value={minted}
          min={1}
          max={5_000}
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
      <output aria-live="polite" className="tw-mt-4 tw-block tw-@container">
        <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-center @[18rem]:tw-grid-cols-3">
          <div className="tw-flex tw-flex-col tw-justify-between">
            <dt className="tw-text-sm tw-text-iron-400">
              {t(locale, "network.tdh.how.rate.edition")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {formatInteger(locale, edition)}
            </dd>
          </div>
          <div className="tw-flex tw-flex-col tw-justify-between">
            <dt className="tw-text-sm tw-text-iron-400">
              {t(locale, "network.tdh.how.rate.exact")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {formatNumber(locale, H / edition, { maximumFractionDigits: 4 })}
            </dd>
          </div>
          <div className="tw-flex tw-flex-col tw-justify-between">
            <dt className="tw-text-sm tw-text-iron-400">
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
        <span className="tw-mt-2 tw-block" aria-hidden="true">
          <LiveRateCurve locale={locale} edition={edition} cents={cents} />
        </span>
        <span className="tw-sr-only">
          {t(locale, "network.tdh.how.rate.result", {
            edition: formatInteger(locale, edition),
            rate,
          })}
        </span>
      </output>
    </ExplorableFrame>
  );
}
