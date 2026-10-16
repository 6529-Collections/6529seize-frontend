import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { formatPercent, selectPluralCategory } from "@/i18n/format";
import type {
  VerificationAgreement,
  VerificationDay,
} from "@/lib/tdh/verification/schema";
import {
  FIRST_REPORT_DATE,
  type CutoverState,
} from "@/lib/tdh/verification/states";
import TdhSource from "../../shared/TdhSource";
import { TDH_CARD } from "../../shared/tdhStyles";
import {
  formatCycleDate,
  formatInteger,
  formatShare,
  formatShortCycleDate,
  formatSigned,
} from "./verificationFormat";

const TILE = `${TDH_CARD} tw-flex tw-min-w-0 tw-flex-col tw-p-4 sm:tw-p-5`;
const TILE_LABEL =
  "tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const TILE_SUB = "tw-m-0 tw-mt-0.5 tw-text-xs tw-leading-5 tw-text-iron-400";
const TILE_VALUE =
  "tw-m-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50";
const TILE_FOOT =
  "tw-m-0 tw-mt-auto tw-pt-2 tw-text-xs tw-tabular-nums tw-leading-5";

function plural(locale: SupportedLocale, count: number): "one" | "other" {
  return selectPluralCategory(locale, count) === "one" ? "one" : "other";
}

/**
 * Equal against differing records on one bar. Agreement is usually above
 * 99.9%, so a differing count always keeps a visible sliver.
 */
export function AgreementMeter({
  locale,
  equal,
  total,
}: {
  readonly locale: SupportedLocale;
  readonly equal: number;
  readonly total: number;
}) {
  const differ = total - equal;
  const share = total > 0 ? equal / total : 1;
  const label = t(
    locale,
    `network.tdh.verify.tiles.meter.${plural(locale, differ)}` as MessageKey,
    {
      equal: formatInteger(locale, equal),
      total: formatInteger(locale, total),
      differ: formatInteger(locale, differ),
    }
  );
  return (
    <span
      role="img"
      aria-label={label}
      className="tw-mt-3 tw-flex tw-h-2 tw-w-full tw-gap-0.5 tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
      data-tdh-meter={`${equal}/${total}`}
    >
      {equal > 0 && (
        <span
          className="tw-h-full tw-rounded-full tw-bg-success"
          style={{ flexGrow: share, flexBasis: 0 }}
        />
      )}
      {differ > 0 && (
        <span
          className="tw-h-full tw-min-w-1.5 tw-rounded-full tw-bg-amber-400"
          style={{ flexGrow: 1 - share, flexBasis: 0 }}
        />
      )}
    </span>
  );
}

function CountTile({
  locale,
  label,
  sub,
  equal,
  total,
  walletsEqual = null,
  walletsTotal = null,
  missing,
  extra,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly sub: string;
  readonly equal: number | null;
  readonly total: number | null;
  readonly walletsEqual?: number | null;
  readonly walletsTotal?: number | null;
  readonly missing: string;
  readonly extra?: ReactNode;
}) {
  if (equal === null || total === null) {
    return (
      <li className={TILE}>
        <p className={TILE_LABEL}>{label}</p>
        <p className={TILE_SUB}>{sub}</p>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {missing}
        </p>
      </li>
    );
  }
  const differ = total - equal;
  return (
    <li className={TILE}>
      <p className={TILE_LABEL}>{label}</p>
      <p className={TILE_SUB}>{sub}</p>
      <p className={TILE_VALUE}>
        {formatInteger(locale, equal)}
        <span className="tw-text-sm tw-font-normal tw-tracking-normal tw-text-iron-400">
          {t(locale, "network.tdh.verify.tiles.ofTotal", {
            total: formatInteger(locale, total),
          })}
        </span>
      </p>
      <AgreementMeter locale={locale} equal={equal} total={total} />
      <p
        className={`${TILE_FOOT} ${differ === 0 ? "tw-text-success" : "tw-text-amber-200"}`}
      >
        {differ === 0
          ? t(locale, "network.tdh.verify.tiles.allEqual")
          : t(
              locale,
              `network.tdh.verify.tiles.differ.${plural(locale, differ)}` as MessageKey,
              {
                count: formatInteger(locale, differ),
                share: formatShare(locale, equal / total),
              }
            )}
      </p>
      {walletsEqual !== null && walletsTotal !== null && (
        <p className="tw-m-0 tw-text-xs tw-tabular-nums tw-leading-5 tw-text-iron-300">
          {t(locale, "network.tdh.verify.tiles.walletsLine", {
            equal: formatInteger(locale, walletsEqual),
            total: formatInteger(locale, walletsTotal),
          })}
        </p>
      )}
      {extra}
    </li>
  );
}

function TotalTile({
  locale,
  rustTotal,
  delta,
  pythonDelta,
}: {
  readonly locale: SupportedLocale;
  readonly rustTotal: number;
  /** Rust minus 6529.io; null when 6529.io was not compared. */
  readonly delta: number | null;
  /** Python minus Rust; null when the Python reference did not run. */
  readonly pythonDelta: number | null;
}) {
  const allEqual = delta === 0 && (pythonDelta === null || pythonDelta === 0);
  const lines: string[] = [];
  if (delta === null) {
    lines.push(t(locale, "network.tdh.verify.tiles.liveMissing"));
  } else if (delta !== 0) {
    lines.push(
      t(
        locale,
        delta < 0
          ? "network.tdh.verify.tiles.liveHigher"
          : "network.tdh.verify.tiles.liveLower",
        { amount: formatInteger(locale, Math.abs(delta)) }
      )
    );
  }
  if (pythonDelta !== null && pythonDelta !== 0) {
    lines.push(
      t(locale, "network.tdh.verify.tiles.pythonDiffers", {
        amount: formatSigned(locale, pythonDelta),
      })
    );
  }
  return (
    <li className={`${TILE} tw-col-span-2 lg:tw-col-span-1`}>
      <p className={TILE_LABEL}>
        {t(locale, "network.tdh.verify.tiles.totalDelta")}
      </p>
      <p className={TILE_SUB}>
        {t(locale, "network.tdh.verify.tiles.totalDeltaSub")}
      </p>
      <p className={TILE_VALUE}>{formatInteger(locale, rustTotal)}</p>
      {allEqual ? (
        <p className={`${TILE_FOOT} tw-text-success`}>
          {t(locale, "network.tdh.verify.tiles.totalsAllEqual")}
        </p>
      ) : (
        lines.map((line) => (
          <p key={line} className={`${TILE_FOOT} tw-text-amber-200`}>
            {line}
          </p>
        ))
      )}
    </li>
  );
}

/** The cutover, D132: a countdown on the latest day, a plain date on others. */
export function CutoverTile({
  locale,
  cutover,
  relative,
}: {
  readonly locale: SupportedLocale;
  readonly cutover: CutoverState;
  /** False on a past day's page: no countdown from today. */
  readonly relative: boolean;
}) {
  const date = formatCycleDate(locale, cutover.plannedDate);
  let headline: string;
  let body: string;
  if (cutover.kind === "done") {
    headline = t(locale, "network.tdh.verify.cutover.done", { date });
    body =
      cutover.cycleDay === null
        ? t(locale, "network.tdh.verify.cutover.doneBodyNoCycle")
        : t(locale, "network.tdh.verify.cutover.doneBody", {
            cycle: formatInteger(locale, cutover.cycleDay),
          });
  } else if (cutover.kind === "countdown" && relative) {
    headline = t(
      locale,
      `network.tdh.verify.cutover.countdown.${plural(locale, cutover.days)}` as MessageKey,
      { days: formatInteger(locale, cutover.days) }
    );
    body = t(locale, "network.tdh.verify.cutover.countdownBody", { date });
  } else {
    headline = t(locale, "network.tdh.verify.cutover.planned", {
      date: formatShortCycleDate(locale, cutover.plannedDate),
    });
    body = t(locale, "network.tdh.verify.cutover.plannedBody", { date });
  }
  return (
    <li
      className={`${TILE} tw-col-span-2 lg:tw-col-span-1`}
      data-cutover={cutover.kind}
    >
      <p
        className={`${TILE_LABEL} tw-flex tw-items-center tw-justify-between tw-gap-2`}
      >
        {t(locale, "network.tdh.verify.cutover.heading")}
        <TdhSource refs={["D132"]} locale={locale} />
      </p>
      <p className={TILE_SUB}>{t(locale, "network.tdh.verify.cutover.sub")}</p>
      <p className={`${TILE_VALUE} tw-text-iron-50`}>{headline}</p>
      {cutover.kind === "countdown" && relative ? (
        <CutoverProgress
          locale={locale}
          elapsed={cutover.elapsed}
          plannedDate={cutover.plannedDate}
        />
      ) : (
        <p className={`${TILE_FOOT} tw-text-iron-300`}>{body}</p>
      )}
    </li>
  );
}

/** The week from the first daily run to the planned cutover (D132). */
function CutoverProgress({
  locale,
  elapsed,
  plannedDate,
}: {
  readonly locale: SupportedLocale;
  readonly elapsed: number;
  readonly plannedDate: string;
}) {
  const label = t(locale, "network.tdh.verify.cutover.progress", {
    elapsed: formatPercent(locale, elapsed, 0),
  });
  return (
    <div className="tw-mt-3">
      <span
        role="img"
        aria-label={label}
        className="tw-relative tw-block tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
      >
        <span
          className="tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-full tw-bg-primary-400"
          style={{ width: `${Math.max(elapsed * 100, 3)}%` }}
        />
      </span>
      <span className="tw-mt-1.5 tw-flex tw-justify-between tw-gap-3 tw-text-xs tw-tabular-nums tw-text-iron-400">
        <span>
          {t(locale, "network.tdh.verify.cutover.start", {
            date: formatShortCycleDate(locale, FIRST_REPORT_DATE),
          })}
        </span>
        <span>
          {t(locale, "network.tdh.verify.cutover.end", {
            date: formatShortCycleDate(locale, plannedDate),
          })}
        </span>
      </span>
    </div>
  );
}

/**
 * The day at a glance, directly under the headline: how many collectors and
 * wallets are equal between Rust and 6529.io and between Rust and Python, the
 * difference of the totals, and the cutover.
 */
export default function VerificationAgreementTiles({
  locale,
  day,
  totalDelta,
  cutover,
  relativeCutover,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay;
  readonly totalDelta: number | null;
  readonly cutover: CutoverState;
  readonly relativeCutover: boolean;
}) {
  const rustVsLive: VerificationAgreement | null = day.agreement.rustVsLive;
  const pythonRan = day.implementations.python !== null;
  const rustVsPython = pythonRan ? day.agreement.rustVsPython : null;
  const afterCutover = cutover.kind === "done";
  const sub = t(locale, "network.tdh.verify.tiles.collectorsEqual");
  const live = (
    <CountTile
      key="live"
      locale={locale}
      label={t(locale, "network.tdh.verify.tiles.rustVsLive")}
      sub={sub}
      equal={rustVsLive?.identitiesEqual ?? null}
      total={rustVsLive?.identitiesTotal ?? null}
      walletsEqual={rustVsLive?.walletsEqual ?? null}
      walletsTotal={rustVsLive?.walletsTotal ?? null}
      missing={t(locale, "network.tdh.verify.tiles.liveMissing")}
    />
  );
  const python = (
    <CountTile
      key="python"
      locale={locale}
      label={t(locale, "network.tdh.verify.tiles.rustVsPython")}
      sub={sub}
      equal={rustVsPython?.identitiesEqual ?? null}
      total={rustVsPython?.identitiesTotal ?? null}
      walletsEqual={rustVsPython?.walletsEqual ?? null}
      walletsTotal={rustVsPython?.walletsTotal ?? null}
      missing={t(locale, "network.tdh.verify.tiles.pythonNotRun")}
    />
  );
  const tiles = afterCutover ? [python, live] : [live, python];
  const pythonTotal = day.implementations.python?.totalTdh ?? null;
  const rustTotal = day.implementations.rust.totalTdh;

  return (
    <section aria-labelledby="tdh-verify-tiles-heading">
      <h2 id="tdh-verify-tiles-heading" className="tw-sr-only">
        {t(locale, "network.tdh.verify.tiles.heading")}
      </h2>
      {afterCutover && (
        <p className="tw-m-0 tw-mb-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdh.verify.tiles.publicationCheck")}
          <TdhSource refs={["P53 §4.5"]} locale={locale} />
        </p>
      )}
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-3 tw-p-0 lg:tw-grid-cols-4">
        {tiles}
        <TotalTile
          locale={locale}
          rustTotal={rustTotal}
          delta={totalDelta}
          pythonDelta={pythonTotal === null ? null : pythonTotal - rustTotal}
        />
        <CutoverTile
          locale={locale}
          cutover={cutover}
          relative={relativeCutover}
        />
      </ul>
    </section>
  );
}
