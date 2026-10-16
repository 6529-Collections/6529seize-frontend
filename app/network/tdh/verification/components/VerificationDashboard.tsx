import type { ReactNode } from "react";
import { selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  DayLoad,
  IndexLoad,
} from "@/lib/tdh/verification/loadVerification.server";
import type {
  VerificationDay,
  VerificationIndexDay,
} from "@/lib/tdh/verification/schema";
import {
  cutoverState,
  dayDifferences,
  dayNeighbours,
  dayVerdict,
  indexDayVerdict,
  latestIndexDay,
  missingCycleDays,
  reportFreshness,
  reportsAreLate,
  sortedIndexDays,
  totalDelta,
  type Freshness,
} from "@/lib/tdh/verification/states";
import TdhPager from "../../shared/TdhPager";
import TdhStatusPill from "../../shared/TdhStatusPill";
import TdhArrowLink from "../../shared/TdhArrowLink";
import { TDH_CARD } from "../../shared/tdhStyles";
import VerificationAgreementTiles, {
  CutoverTile,
} from "./VerificationAgreementTiles";
import VerificationCalendar from "./VerificationCalendar";
import VerificationCheck from "./VerificationCheck";
import VerificationDifferences from "./VerificationDifferences";
import VerificationHeadline from "./VerificationHeadline";
import VerificationHistory from "./VerificationHistory";
import VerificationMethod from "./VerificationMethod";
import VerificationProvenance, {
  type PreviousDay,
} from "./VerificationProvenance";
import VerificationRetry from "./VerificationRetry";
import VerificationSideBySide from "./VerificationSideBySide";
import {
  formatCycleDate,
  formatInteger,
  formatSigned,
} from "./verificationFormat";

function Notice({
  tone,
  title,
  children,
}: {
  readonly tone: "warning" | "neutral" | "error";
  readonly title: string;
  readonly children?: ReactNode;
}) {
  const border = {
    warning: "tw-border-amber-400/40 tw-bg-amber-400/[0.06]",
    neutral: "tw-border-white/10 tw-bg-iron-900",
    error: "tw-border-error/40 tw-bg-error/[0.06]",
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "note"}
      className={`tw-rounded-xl tw-border tw-border-solid tw-p-4 sm:tw-p-5 ${border}`}
    >
      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
        {title}
      </p>
      {children !== undefined && (
        <div className="tw-mt-1.5 tw-space-y-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          {children}
        </div>
      )}
    </div>
  );
}

export function VerificationLede({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return <p className="tw-m-0">{t(locale, "network.tdh.verify.lede")}</p>;
}

/** The latest report, and a warning when reports are late or missing. */
function FreshnessLine({
  locale,
  freshness,
  latestDate,
  missingDays,
}: {
  readonly locale: SupportedLocale;
  readonly freshness: Freshness;
  readonly latestDate: string;
  readonly missingDays: number;
}) {
  const latest = {
    cycle: formatInteger(locale, freshness.latest),
    date: formatCycleDate(locale, latestDate),
  };
  const late = freshness.kind === "late";
  const one = (count: number) => selectPluralCategory(locale, count) === "one";
  let status = t(locale, "network.tdh.verify.status.latest", latest);
  if (late) {
    status = t(
      locale,
      one(freshness.missing)
        ? "network.tdh.verify.status.late.one"
        : "network.tdh.verify.status.late.other",
      { ...latest, days: formatInteger(locale, freshness.missing) }
    );
  }
  const missingKey = one(missingDays)
    ? "network.tdh.verify.status.missing.one"
    : "network.tdh.verify.status.missing.other";
  return (
    <div className="tw-space-y-1 tw-text-sm tw-leading-6">
      <p
        className={`tw-m-0 ${late ? "tw-text-amber-100" : "tw-text-iron-400"}`}
        role={late ? "status" : undefined}
      >
        {status}
      </p>
      {missingDays > 0 && (
        <p className="tw-m-0 tw-text-amber-100">
          {t(locale, missingKey, {
            count: formatInteger(locale, missingDays),
          })}
        </p>
      )}
    </div>
  );
}

function AwaitingState({
  locale,
  now,
}: {
  readonly locale: SupportedLocale;
  readonly now: Date;
}) {
  const late = reportsAreLate(now);
  return (
    <div className="tw-space-y-8">
      <div className="tw-grid tw-gap-3 lg:tw-grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Notice
          tone="neutral"
          title={t(
            locale,
            late
              ? "network.tdh.verify.awaiting.titleLate"
              : "network.tdh.verify.awaiting.title"
          )}
        >
          <p className="tw-m-0">
            {t(
              locale,
              late
                ? "network.tdh.verify.awaiting.bodyLate"
                : "network.tdh.verify.awaiting.body"
            )}
          </p>
          <TdhArrowLink href="/network/tdh/specification#evidence">
            {t(locale, "network.tdh.verify.awaiting.link")}
          </TdhArrowLink>
        </Notice>
        <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-p-0 lg:tw-grid-cols-1">
          <CutoverTile
            locale={locale}
            cutover={cutoverState(null, now)}
            relative
          />
        </ul>
      </div>
      <VerificationMethod locale={locale} />
      <TdhPager current="/network/tdh/verification" locale={locale} />
    </div>
  );
}

/** The index could not be loaded: the error, then how the comparison works. */
function IndexError({
  locale,
  reason,
}: {
  readonly locale: SupportedLocale;
  readonly reason: string;
}) {
  return (
    <div className="tw-space-y-8">
      <Notice tone="error" title={t(locale, "network.tdh.verify.error.title")}>
        <p className="tw-m-0">
          {reason === "config"
            ? t(locale, "network.tdh.verify.error.config")
            : t(locale, "network.tdh.verify.error.body")}
        </p>
        <VerificationRetry label={t(locale, "network.tdh.verify.retry")} />
      </Notice>
      <VerificationMethod locale={locale} />
    </div>
  );
}

/** Rust minus 6529.io for the day, from its file or else from the index. */
function dayTotalDelta(
  day: VerificationDay | null,
  entry: VerificationIndexDay
): number | null {
  return day
    ? totalDelta(
        day.implementations.rust.totalTdh,
        day.implementations.live?.totalTdh
      )
    : totalDelta(entry.totalTdh.rust, entry.totalTdh.live);
}

export default function VerificationDashboard({
  locale,
  indexLoad,
  dayLoad,
  selected,
  now,
  permalink = false,
  previousDay = null,
}: {
  readonly locale: SupportedLocale;
  readonly indexLoad: IndexLoad;
  readonly dayLoad: DayLoad | null;
  readonly selected: VerificationIndexDay | null;
  readonly now: Date;
  /** A day's own page, a record: no live freshness, cutover as of the day. */
  readonly permalink?: boolean;
  /** The day before, with its file's SHA-256, for the provenance chain. */
  readonly previousDay?: PreviousDay | null;
}) {
  if (indexLoad.status === "awaiting") {
    return <AwaitingState locale={locale} now={now} />;
  }

  if (indexLoad.status === "error") {
    return <IndexError locale={locale} reason={indexLoad.reason} />;
  }

  const index = indexLoad.index;
  const cutover = cutoverState(index.cutover, now);
  const days = sortedIndexDays(index);
  const entry = selected ?? days[0] ?? null;
  if (entry === null) {
    return null;
  }
  const latest = latestIndexDay(index);
  const neighbours = dayNeighbours(index, entry.cycleDay);
  const loaded = dayLoad?.status === "ok" ? dayLoad : null;
  const day = loaded?.day ?? null;
  const isLatest = latest?.cycleDay === entry.cycleDay;
  const delta = dayTotalDelta(day, entry);
  const missing = missingCycleDays(index);
  const freshness = latest ? reportFreshness(latest.cycleDay, now) : null;
  const agreementComplete = isAgreementComplete(day);

  return (
    <div>
      <div className="tw-space-y-4">
        {day ? (
          <>
            <VerificationHeadline
              locale={locale}
              day={day}
              verdict={dayVerdict(day)}
              neighbours={neighbours}
              isLatest={isLatest}
              permalink={permalink}
              daySha256={loaded?.sha256 ?? null}
            />
            <VerificationAgreementTiles
              locale={locale}
              day={day}
              totalDelta={delta}
              cutover={
                permalink
                  ? cutoverState(
                      index.cutover,
                      new Date(`${entry.date}T00:00:00Z`)
                    )
                  : cutover
              }
              relativeCutover={!permalink}
            />
          </>
        ) : (
          <DayMissing locale={locale} entry={entry} failed={dayLoad !== null} />
        )}
        <VerificationCalendar
          locale={locale}
          days={index.days}
          selectedCycleDay={entry.cycleDay}
          upcomingUntil={
            cutover.kind === "countdown" ? cutover.plannedDate : null
          }
          now={now}
        />
        {!permalink && freshness && latest && (
          <FreshnessLine
            locale={locale}
            freshness={freshness}
            latestDate={latest.date}
            missingDays={missing.length}
          />
        )}
      </div>
      {day && (
        <>
          <VerificationSideBySide
            locale={locale}
            rust={day.implementations.rust}
            python={day.implementations.python}
            live={day.implementations.live}
          />
          <VerificationDifferences
            locale={locale}
            differences={dayDifferences(day)}
            agreementComplete={agreementComplete}
          />
        </>
      )}
      <VerificationHistory
        locale={locale}
        days={index.days}
        missing={missing}
        selectedCycleDay={entry.cycleDay}
        cutoverCycleDay={cutover.kind === "done" ? cutover.cycleDay : null}
      />
      <VerificationProvenance
        locale={locale}
        day={day}
        dayUrl={loaded?.dayUrl ?? null}
        daySha256={loaded?.sha256 ?? null}
        previousDay={previousDay}
        indexUrl={indexLoad.indexUrl}
        indexEntry={entry}
        indexGeneratedAt={index.generatedAt ?? null}
      />
      <VerificationCheck locale={locale} day={day} cycleDay={entry.cycleDay} />
      <VerificationMethod locale={locale} />
      <TdhPager current="/network/tdh/verification" locale={locale} />
    </div>
  );
}

/** A listed day whose own file failed: the error, then the index's counts. */
function DayMissing({
  locale,
  entry,
  failed,
}: {
  readonly locale: SupportedLocale;
  readonly entry: VerificationIndexDay;
  readonly failed: boolean;
}) {
  return (
    <>
      {failed && (
        <Notice
          tone="error"
          title={t(locale, "network.tdh.verify.error.dayTitle")}
        >
          <p className="tw-m-0">
            {t(locale, "network.tdh.verify.error.dayBody")}
          </p>
          <VerificationRetry label={t(locale, "network.tdh.verify.retry")} />
        </Notice>
      )}
      <IndexOnlySummary locale={locale} entry={entry} />
    </>
  );
}

/** Whether both comparisons found every record equal. */
function isAgreementComplete(day: VerificationDay | null): boolean {
  return (
    day !== null &&
    [day.agreement.rustVsLive, day.agreement.rustVsPython].every(
      (agreement) =>
        agreement !== null &&
        agreement.identitiesEqual === agreement.identitiesTotal &&
        agreement.walletsEqual === agreement.walletsTotal
    )
  );
}

/** When the day file is missing, the index still gives the headline counts. */
function IndexOnlySummary({
  locale,
  entry,
}: {
  readonly locale: SupportedLocale;
  readonly entry: VerificationIndexDay;
}) {
  const delta = totalDelta(entry.totalTdh.rust, entry.totalTdh.live);
  return (
    <div
      className={`${TDH_CARD} tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-2 tw-p-5 tw-text-sm tw-text-iron-200`}
    >
      <TdhStatusPill pill={indexDayVerdict(entry)} locale={locale} />
      <span className="tw-font-medium tw-text-iron-50">
        {formatCycleDate(locale, entry.date)}
      </span>
      {entry.identitiesEqual !== null && entry.identitiesTotal !== null && (
        <span className="tw-tabular-nums">
          {t(locale, "network.tdh.verify.tiles.identities")}:{" "}
          {t(locale, "network.tdh.verify.history.equalOf", {
            equal: formatInteger(locale, entry.identitiesEqual),
            total: formatInteger(locale, entry.identitiesTotal),
          })}
        </span>
      )}
      {delta !== null && (
        <span className="tw-tabular-nums">
          {t(locale, "network.tdh.verify.tiles.totalDelta")}:{" "}
          {formatSigned(locale, delta)}
        </span>
      )}
    </div>
  );
}
