"use client";

import { useId, useState } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  EXAMPLE_NETWORK,
  GRADIENT_MAX_COUNT,
  boost,
  seasonsFor,
  type BoostBreakdown,
} from "@/lib/tdh/tdhV1Arithmetic";
import { TDH_FOCUS_RING } from "../../shared/tdhStyles";
import ExplorableFrame from "./ExplorableFrame";
import IntegerField from "./IntegerField";

const SEASONS = seasonsFor(EXAMPLE_NETWORK.eligibleMemes);
const CURRENT_SEASON = SEASONS.at(-1) ?? 0;
const CEILING_CENTS = 224;

const PARTS = [
  {
    key: "seasons",
    field: "seasonsMicro",
    className: "tw-fill-sky-400",
    dot: "tw-bg-sky-400",
  },
  {
    key: "extra",
    field: "additionalSetsMicro",
    className: "tw-fill-sky-200",
    dot: "tw-bg-sky-200",
  },
  {
    key: "genesis",
    field: "genesisMicro",
    className: "tw-fill-teal-300",
    dot: "tw-bg-teal-300",
  },
  {
    key: "nakamoto",
    field: "nakamotoMicro",
    className: "tw-fill-teal-500",
    dot: "tw-bg-teal-500",
  },
  {
    key: "gradients",
    field: "gradientsMicro",
    className: "tw-fill-fuchsia-400",
    dot: "tw-bg-fuchsia-400",
  },
] as const;

function multiplier(locale: SupportedLocale, cents: number): string {
  return formatNumber(locale, cents / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function micro(locale: SupportedLocale, value: number): string {
  return formatNumber(locale, value / 1_000_000, {
    signDisplay: "always",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/** The boost ladder (plan §6.2, diagram 5), from 1.00 to the 2.24 ceiling. */
export function BoostLadder({
  locale,
  breakdown,
}: {
  readonly locale: SupportedLocale;
  readonly breakdown: BoostBreakdown;
}) {
  const id = useId();
  const width = 600;
  const scale = (microValue: number) =>
    (microValue / ((CEILING_CENTS - 100) * 10_000)) * (width - 20);
  const sizes = PARTS.map((part) => scale(breakdown[part.field]));
  const segments = PARTS.map((part, index) => ({
    ...part,
    size: sizes[index] ?? 0,
    x: 10 + sizes.slice(0, index).reduce((sum, size) => sum + size, 0),
  }));
  const marker = 10 + scale((breakdown.betaCents - 100) * 10_000);
  return (
    <svg
      viewBox={`0 0 ${width} 72`}
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className="tw-block tw-h-auto tw-w-full"
    >
      <title id={`${id}-title`}>
        {t(locale, "network.tdh.how.boostBuilder.ladderTitle")}
      </title>
      <desc id={`${id}-desc`}>
        {t(locale, "network.tdh.how.boostBuilder.ladderDesc", {
          boost: multiplier(locale, breakdown.betaCents),
        })}
      </desc>
      <rect
        x="10"
        y="22"
        width={width - 20}
        height="16"
        rx="8"
        className="tw-fill-iron-800"
      />
      {segments.map((segment) =>
        segment.size > 0 ? (
          <rect
            key={segment.key}
            x={segment.x}
            y="22"
            width={segment.size}
            height="16"
            className={`${segment.className} tw-transition-all tw-duration-200 motion-reduce:tw-transition-none`}
          />
        ) : null
      )}
      <line
        x1={marker}
        x2={marker}
        y1="14"
        y2="46"
        strokeWidth="2"
        className="tw-stroke-iron-50"
      />
      <text
        x={marker}
        y="10"
        textAnchor="middle"
        className="tw-fill-iron-50 tw-text-[12px] tw-font-semibold tw-tabular-nums"
      >
        {multiplier(locale, breakdown.betaCents)}
      </text>
      <text
        x="10"
        y="62"
        className="tw-fill-iron-400 tw-text-[11px] tw-tabular-nums"
      >
        {multiplier(locale, 100)}
      </text>
      <text
        x={width - 10}
        y="62"
        textAnchor="end"
        className="tw-fill-iron-400 tw-text-[11px]"
      >
        {t(locale, "network.tdh.how.boostBuilder.ceiling")}
      </text>
    </svg>
  );
}

/** Step 9: build a collection and watch the boost respond. */
export default function BoostBuilder({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const [fullSets, setFullSets] = useState(0);
  const [gradients, setGradients] = useState(1);
  const [seasons, setSeasons] = useState<ReadonlySet<number>>(new Set());
  const [genesis, setGenesis] = useState(false);
  const [nakamoto, setNakamoto] = useState(false);
  const breakdown = boost({
    fullSets,
    gradients,
    completeSeasons: [...seasons],
    genesis,
    nakamoto,
    nMemes: EXAMPLE_NETWORK.eligibleMemes,
  });
  const reset = () => {
    setFullSets(0);
    setGradients(1);
    setSeasons(new Set());
    setGenesis(false);
    setNakamoto(false);
  };
  const toggleSeason = (season: number) =>
    setSeasons((current) => {
      const next = new Set(current);
      if (next.has(season)) {
        next.delete(season);
      } else {
        next.add(season);
      }
      return next;
    });
  const fullSetChosen = fullSets > 0;
  const season1Complete = seasons.has(1);
  const label = (key: "fullSets" | "gradients") =>
    t(locale, `network.tdh.how.boostBuilder.${key}`);
  const checkbox = `tw-form-checkbox tw-size-5 tw-shrink-0 tw-rounded tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-opacity-40 ${TDH_FOCUS_RING}`;

  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.boostBuilder.title")}
      onReset={reset}
    >
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {t(locale, "network.tdh.how.boostBuilder.intro")}
      </p>
      <div className="tw-mt-3 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <IntegerField
          label={label("fullSets")}
          value={fullSets}
          min={0}
          max={40}
          onChange={setFullSets}
          increaseLabel={t(locale, "network.tdh.shared.increase", {
            name: label("fullSets"),
          })}
          decreaseLabel={t(locale, "network.tdh.shared.decrease", {
            name: label("fullSets"),
          })}
        />
        <IntegerField
          label={label("gradients")}
          value={gradients}
          min={0}
          max={7}
          onChange={setGradients}
          increaseLabel={t(locale, "network.tdh.shared.increase", {
            name: label("gradients"),
          })}
          decreaseLabel={t(locale, "network.tdh.shared.decrease", {
            name: label("gradients"),
          })}
          {...(gradients > GRADIENT_MAX_COUNT
            ? { hint: t(locale, "network.tdh.how.boostBuilder.gradientCap") }
            : {})}
        />
      </div>
      <fieldset
        className="tw-m-0 tw-mt-4 tw-min-w-0 tw-border-0 tw-p-0"
        disabled={fullSetChosen}
        aria-describedby={fullSetChosen ? `${id}-fullset` : undefined}
      >
        <legend className="tw-p-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {t(locale, "network.tdh.how.boostBuilder.seasons")}
        </legend>
        {fullSetChosen && (
          <p
            id={`${id}-fullset`}
            className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400"
          >
            {t(locale, "network.tdh.how.boostBuilder.disabledFullSet")}
          </p>
        )}
        <div className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-3 sm:tw-grid-cols-3 lg:tw-grid-cols-4">
          {SEASONS.map((season) => (
            <label
              key={season}
              className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200"
            >
              <input
                type="checkbox"
                className={checkbox}
                checked={fullSetChosen || seasons.has(season)}
                onChange={() => toggleSeason(season)}
              />
              {season === CURRENT_SEASON
                ? t(locale, "network.tdh.how.boostBuilder.seasonCurrent", {
                    season: formatInteger(locale, season),
                  })
                : t(locale, "network.tdh.how.boostBuilder.season", {
                    season: formatInteger(locale, season),
                  })}
            </label>
          ))}
        </div>
        <div
          className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-6"
          aria-describedby={season1Complete ? `${id}-season1` : undefined}
        >
          {(["genesis", "nakamoto"] as const).map((key) => (
            <label
              key={key}
              className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-text-iron-200"
            >
              <input
                type="checkbox"
                className={checkbox}
                disabled={season1Complete}
                checked={
                  fullSetChosen ||
                  season1Complete ||
                  (key === "genesis" ? genesis : nakamoto)
                }
                onChange={(event) =>
                  (key === "genesis" ? setGenesis : setNakamoto)(
                    event.target.checked
                  )
                }
              />
              {t(locale, `network.tdh.how.boostBuilder.${key}`)}
            </label>
          ))}
        </div>
        {season1Complete && !fullSetChosen && (
          <p
            id={`${id}-season1`}
            className="tw-m-0 tw-text-xs tw-text-iron-400"
          >
            {t(locale, "network.tdh.how.boostBuilder.disabledSeason1")}
          </p>
        )}
      </fieldset>
      <output
        aria-live="polite"
        className="tw-mt-4 tw-block tw-rounded-lg tw-bg-iron-900 tw-p-4"
      >
        <span className="tw-block tw-text-2xl tw-font-semibold tw-tabular-nums tw-text-iron-50">
          {t(locale, "network.tdh.how.boostBuilder.result", {
            boost: multiplier(locale, breakdown.betaCents),
          })}
        </span>
        <span className="tw-mt-3 tw-block" aria-hidden="true">
          <BoostLadder locale={locale} breakdown={breakdown} />
        </span>
        <span className="tw-mt-2 tw-block tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
          {t(locale, "network.tdh.how.boostBuilder.parts")}
        </span>
        <span className="tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-tabular-nums sm:tw-grid-cols-3">
          <span className="tw-text-iron-300">
            {t(locale, "network.tdh.how.boostBuilder.part.base")}{" "}
            {multiplier(locale, 100)}
          </span>
          {PARTS.map((part) => (
            <span
              key={part.key}
              className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-300"
            >
              <span
                aria-hidden="true"
                className={`tw-size-2 tw-rounded-full ${part.dot}`}
              />
              {t(locale, `network.tdh.how.boostBuilder.part.${part.key}`)}{" "}
              {micro(locale, breakdown[part.field])}
            </span>
          ))}
        </span>
      </output>
    </ExplorableFrame>
  );
}
