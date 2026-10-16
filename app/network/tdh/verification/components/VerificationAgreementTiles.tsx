import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { selectPluralCategory } from "@/i18n/format";
import type {
  VerificationAgreement,
  VerificationDay,
} from "@/lib/tdh/verification/schema";
import {
  FIRST_REPORT_DATE,
  type CutoverState,
} from "@/lib/tdh/verification/states";
import CaseSafe from "../../shared/CaseSafe";
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
const TILE_VALUE =
  "tw-m-0 tw-mt-2 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50";
/** A line right under the figure. */
const TILE_FOOT = "tw-m-0 tw-mt-2 tw-text-sm tw-tabular-nums tw-leading-5";
/**
 * What the tile compares, at its foot: label, figure, then caption, so the
 * figures of a row share one baseline however the captions wrap.
 */
const TILE_CAPTION =
  "tw-m-0 tw-mt-auto tw-pt-3 tw-text-sm tw-leading-5 tw-text-iron-400";

function plural(locale: SupportedLocale, count: number): "one" | "other" {
  return selectPluralCategory(locale, count) === "one" ? "one" : "other";
}

/**
 * Equal against differing records on one bar. Agreement is usually above
 * 99.9%, so a differing count always keeps a visible sliver.
 */
function AgreementMeter({
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
  note,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly sub: string;
  /** A line under the sub-label: what the comparison is made against. */
  readonly note?: string;
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
        <p className={TILE_LABEL}>
          <CaseSafe text={label} />
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {missing}
        </p>
        <p className={TILE_CAPTION}>{sub}</p>
      </li>
    );
  }
  const differ = total - equal;
  return (
    <li className={TILE}>
      <p className={TILE_LABEL}>
        <CaseSafe text={label} />
      </p>
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
        <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-5 tw-text-iron-300">
          {t(locale, "network.tdh.verify.tiles.walletsLine", {
            equal: formatInteger(locale, walletsEqual),
            total: formatInteger(locale, walletsTotal),
          })}
        </p>
      )}
      {extra}
      <p className={TILE_CAPTION}>{note ? `${sub}. ${note}.` : sub}</p>
    </li>
  );
}

/**
 * The day's total, with the differences in the feed's one direction: Rust
 * minus the other (`rustVsLive`), the same sign the strip, the difference
 * panel and the day-by-day table use.
 */
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
  /** Rust minus Python; null when the Python reference did not run. */
  readonly pythonDelta: number | null;
}) {
  const allEqual = delta === 0 && (pythonDelta === null || pythonDelta === 0);
  const lines: string[] = [];
  if (delta === null) {
    lines.push(t(locale, "network.tdh.verify.tiles.liveMissing"));
  } else if (delta !== 0) {
    lines.push(
      t(locale, "network.tdh.verify.tiles.liveHigher", {
        amount: formatSigned(locale, delta),
      })
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
    <li className={TILE}>
      <p className={TILE_LABEL}>
        {t(locale, "network.tdh.verify.tiles.totalDelta")}
      </p>
      <p className={TILE_VALUE}>{formatInteger(locale, rustTotal)}</p>
      <dl className="tw-m-0 tw-mt-3 tw-space-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-2 tw-text-sm tw-tabular-nums tw-leading-5">
        {(
          [
            ["rustMinusLive", delta],
            ["rustMinusPython", pythonDelta],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="tw-flex tw-justify-between tw-gap-3">
            <dt className="tw-text-iron-400">
              {t(locale, `network.tdh.verify.tiles.${key}`)}
            </dt>
            <dd
              className={`tw-m-0 tw-font-medium ${value === 0 ? "tw-text-success" : "tw-text-iron-200"}`}
            >
              {value === null
                ? t(locale, "network.tdh.verify.history.noValue")
                : formatSigned(locale, value)}
            </dd>
          </div>
        ))}
      </dl>
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
      <p className={TILE_CAPTION}>
        {t(locale, "network.tdh.verify.tiles.totalDeltaSub")}.{" "}
        {t(locale, "network.tdh.verify.tiles.signedTotalNote")}
      </p>
    </li>
  );
}

/**
 * The cutover, D132: planned for about a date, never on one, so the tile
 * shows the date with "about" and never counts the days. On a day's own
 * page it says how that day stood, so the record does not go stale.
 */
export function CutoverTile({
  locale,
  cutover,
  relative,
}: {
  readonly locale: SupportedLocale;
  readonly cutover: CutoverState;
  /** False on a day's own page: the tile is as of that day. */
  readonly relative: boolean;
}) {
  const date = formatCycleDate(locale, cutover.plannedDate);
  let headline = t(locale, "network.tdh.verify.cutover.planned", {
    date: formatShortCycleDate(locale, cutover.plannedDate),
  });
  let body: string;
  if (cutover.kind === "done") {
    headline = t(locale, "network.tdh.verify.cutover.done", { date });
    body =
      cutover.cycleDay === null
        ? t(locale, "network.tdh.verify.cutover.doneBodyNoCycle")
        : t(locale, "network.tdh.verify.cutover.doneBody", {
            cycle: formatInteger(locale, cutover.cycleDay),
          });
  } else if (cutover.kind === "countdown") {
    body = relative
      ? t(locale, "network.tdh.verify.cutover.plannedBody", {
          date,
          start: formatCycleDate(locale, FIRST_REPORT_DATE),
        })
      : t(locale, "network.tdh.verify.cutover.plannedOnDay", { date });
  } else {
    body = t(locale, "network.tdh.verify.cutover.dueBody", { date });
  }
  return (
    <li className={TILE} data-cutover={cutover.kind}>
      <p
        className={`${TILE_LABEL} tw-flex tw-items-baseline tw-justify-between tw-gap-2`}
      >
        {t(locale, "network.tdh.verify.cutover.heading")}
        <TdhSource refs={["D132"]} locale={locale} />
      </p>
      <p className={`${TILE_VALUE} tw-text-iron-50`}>{headline}</p>
      <p className={`${TILE_FOOT} tw-text-iron-300`}>{body}</p>
      <p className={TILE_CAPTION}>
        {t(locale, "network.tdh.verify.cutover.sub")}
      </p>
    </li>
  );
}

/**
 * The day at a glance, directly under the headline: how many identity and
 * wallet records are equal between Rust and 6529.io and between Rust and Python, the
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
      note={t(locale, "network.tdh.verify.tiles.liveNote")}
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
      note={t(locale, "network.tdh.verify.tiles.pythonNote")}
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
    <section
      aria-labelledby="tdh-verify-tiles-heading"
      className="tw-@container"
    >
      <h2 id="tdh-verify-tiles-heading" className="tw-sr-only">
        {t(locale, "network.tdh.verify.tiles.heading")}
      </h2>
      {afterCutover && (
        <p className="tw-m-0 tw-mb-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdh.verify.tiles.publicationCheck")}
          <TdhSource refs={["P53 §4.5"]} locale={locale} />
        </p>
      )}
      {/* One tile a row on a phone, a 2 × 2 grid from 26rem, and one row of
          four from 56rem: never 2 + 1 + 1. */}
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 @[26rem]:tw-grid-cols-2 @[56rem]:tw-grid-cols-4">
        {tiles}
        <TotalTile
          locale={locale}
          rustTotal={rustTotal}
          delta={totalDelta}
          pythonDelta={pythonTotal === null ? null : rustTotal - pythonTotal}
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
