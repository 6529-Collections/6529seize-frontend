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
import { MAX_BOOST_CENTS } from "../examples";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
} from "../../shared/tdhStyles";
import ExplorableFrame from "./ExplorableFrame";
import IntegerField from "./IntegerField";

const SEASONS = seasonsFor(EXAMPLE_NETWORK.eligibleMemes);
const CURRENT_SEASON = SEASONS.at(-1) ?? 0;

/** Five parts, five distinct hues; the legend names each one too. */
const PARTS = [
  { key: "seasons", field: "seasonsMicro", dot: "tw-bg-sky-400" },
  { key: "extra", field: "additionalSetsMicro", dot: "tw-bg-indigo-300" },
  { key: "genesis", field: "genesisMicro", dot: "tw-bg-emerald-400" },
  { key: "nakamoto", field: "nakamotoMicro", dot: "tw-bg-amber-300" },
  { key: "gradients", field: "gradientsMicro", dot: "tw-bg-fuchsia-400" },
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

/**
 * The boost ladder (plan §6.2, diagram 5), from 1.00 to the highest boost on
 * the 2026-10-11 cycle, 2.04. Drawn in HTML, so its labels keep their size
 * on a phone.
 */
function BoostLadder({
  locale,
  breakdown,
}: {
  readonly locale: SupportedLocale;
  readonly breakdown: BoostBreakdown;
}) {
  const span = (MAX_BOOST_CENTS - 100) * 10_000;
  const share = (microValue: number) =>
    Math.min(Math.max((microValue / span) * 100, 0), 100);
  const marker = share((breakdown.betaCents - 100) * 10_000);
  let shift = "-50%";
  if (marker > 85) {
    shift = "-100%";
  } else if (marker < 8) {
    shift = "0";
  }
  return (
    <span
      className="tw-block"
      role="img"
      aria-label={t(locale, "network.tdh.how.boostBuilder.ladderDesc", {
        boost: multiplier(locale, breakdown.betaCents),
      })}
    >
      <span className="tw-relative tw-block tw-pt-6">
        <span
          className="tw-absolute tw-top-0 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-iron-50"
          style={{
            left: `${marker}%`,
            transform: `translateX(${shift})`,
          }}
        >
          {multiplier(locale, breakdown.betaCents)}
        </span>
        <span className="tw-relative tw-flex tw-h-4 tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
          {PARTS.map((part) => {
            const width = share(breakdown[part.field]);
            return width > 0 ? (
              <span
                key={part.key}
                className={`tw-h-full tw-transition-all tw-duration-200 motion-reduce:tw-transition-none ${part.dot}`}
                style={{ width: `${width}%` }}
              />
            ) : null;
          })}
        </span>
        <span
          className="tw-absolute tw-bottom-[-4px] tw-top-5 tw-w-0.5 tw-bg-iron-50"
          style={{ left: `${marker}%` }}
        />
      </span>
      <span className="tw-mt-2 tw-flex tw-justify-between tw-text-xs tw-tabular-nums tw-text-iron-300">
        <span>{multiplier(locale, 100)}</span>
        <span>{t(locale, "network.tdh.how.boostBuilder.ceiling")}</span>
      </span>
    </span>
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
  const seasonName = (season: number) =>
    t(locale, "network.tdh.how.boostBuilder.season", {
      season: formatInteger(locale, season),
    });
  const currentBadge = t(locale, "network.tdh.how.boostBuilder.currentBadge");
  const season1Complete = seasons.has(1);
  const label = (key: "fullSets" | "gradients") =>
    t(locale, `network.tdh.how.boostBuilder.${key}`);

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
        {/* Seasons as toggle chips on a grid whose rows balance (6, 6 and 5
            on phones; 9 and 8 from sm), then Genesis and Nakamoto, the two
            partial bonuses of season 1. */}
        <div className="tw-mt-2 tw-grid tw-grid-cols-6 tw-gap-1.5 sm:tw-grid-cols-9">
          {SEASONS.map((season) => {
            const on = fullSetChosen || seasons.has(season);
            const current = season === CURRENT_SEASON;
            return (
              <button
                key={season}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSeason(season)}
                aria-label={
                  current
                    ? `${seasonName(season)}, ${currentBadge}`
                    : seasonName(season)
                }
                className={`${TDH_CHIP_BUTTON} tw-w-full tw-min-w-0 tw-justify-center tw-px-1 tw-tabular-nums disabled:tw-cursor-not-allowed ${on ? TDH_CHIP_ON : TDH_CHIP_OFF} ${current ? "tw-border-dashed" : ""}`}
              >
                {formatInteger(locale, season)}
              </button>
            );
          })}
        </div>
        <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-400">
          {t(locale, "network.tdh.how.boostBuilder.currentNote", {
            season: formatInteger(locale, CURRENT_SEASON),
          })}
        </p>
        <div
          className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-1.5"
          aria-describedby={season1Complete ? `${id}-season1` : undefined}
        >
          {(["genesis", "nakamoto"] as const).map((key) => {
            const on =
              fullSetChosen ||
              season1Complete ||
              (key === "genesis" ? genesis : nakamoto);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                disabled={season1Complete}
                onClick={() =>
                  (key === "genesis" ? setGenesis : setNakamoto)(
                    (value) => !value
                  )
                }
                className={`${TDH_CHIP_BUTTON} disabled:tw-cursor-not-allowed disabled:tw-opacity-60 ${on ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
              >
                {t(locale, `network.tdh.how.boostBuilder.${key}`)}
              </button>
            );
          })}
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
        <span className="tw-mt-3 tw-block">
          <BoostLadder locale={locale} breakdown={breakdown} />
        </span>
        <span className="tw-mt-2 tw-block tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
          {t(locale, "network.tdh.how.boostBuilder.parts")}
        </span>
        <span className="tw-mt-2 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-tabular-nums min-[400px]:tw-grid-cols-2 sm:tw-grid-cols-3">
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
