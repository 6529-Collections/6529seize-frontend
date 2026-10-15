import Link from "next/link";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  DayLoad,
  IndexLoad,
} from "@/lib/tdh/verification/loadVerification.server";
import type { VerificationIndexDay } from "@/lib/tdh/verification/schema";
import {
  cutoverState,
  dayNeighbours,
  indexDayVerdict,
  latestIndexDay,
  missingCycleDays,
  reportFreshness,
  reportsAreLate,
  sortedIndexDays,
  totalDelta,
  verdictState,
} from "@/lib/tdh/verification/states";
import TdhPager from "../../shared/TdhPager";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { TDH_CARD, TDH_LINK_STANDALONE } from "../../shared/tdhStyles";
import VerificationAgreementTiles from "./VerificationAgreementTiles";
import VerificationCheck from "./VerificationCheck";
import VerificationDayPicker from "./VerificationDayPicker";
import VerificationDifferences from "./VerificationDifferences";
import VerificationHistory from "./VerificationHistory";
import VerificationMethod from "./VerificationMethod";
import VerificationProvenance from "./VerificationProvenance";
import VerificationRetry from "./VerificationRetry";
import VerificationSideBySide from "./VerificationSideBySide";
import {
  VerificationCutoverCard,
  VerificationStatusBand,
} from "./VerificationStatusBand";
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
      className={`tw-rounded-xl tw-border tw-border-solid tw-p-5 ${border}`}
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
  return (
    <p className="tw-m-0">
      {t(locale, "network.tdh.verify.lede")}
      <TdhSource refs={["D132", "P53 §12"]} locale={locale} />
    </p>
  );
}

export function SampleBanner({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <Notice tone="warning" title={t(locale, "network.tdh.verify.sample.title")}>
      <p className="tw-m-0">
        {t(locale, "network.tdh.verify.sample.body")}
        <TdhSource
          refs={["D131", "Comparison 2026-10-14/15"]}
          locale={locale}
        />
      </p>
    </Notice>
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
      <div className="tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
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
            <TdhSource refs={["D132"]} locale={locale} />
          </p>
          <Link
            href="/network/tdh/specification#evidence"
            className={TDH_LINK_STANDALONE}
          >
            {t(locale, "network.tdh.verify.awaiting.link")}
          </Link>
        </Notice>
        <VerificationCutoverCard
          locale={locale}
          cutover={cutoverState(null, now)}
        />
      </div>
      <VerificationMethod locale={locale} />
      <TdhPager current="/network/tdh/verification" locale={locale} />
    </div>
  );
}

export default function VerificationDashboard({
  locale,
  indexLoad,
  dayLoad,
  selected,
  now,
}: {
  readonly locale: SupportedLocale;
  readonly indexLoad: IndexLoad;
  readonly dayLoad: DayLoad | null;
  readonly selected: VerificationIndexDay | null;
  readonly now: Date;
}) {
  if (indexLoad.status === "awaiting") {
    return <AwaitingState locale={locale} now={now} />;
  }

  if (indexLoad.status === "error") {
    return (
      <div className="tw-space-y-8">
        <Notice
          tone="error"
          title={t(locale, "network.tdh.verify.error.title")}
        >
          <p className="tw-m-0">
            {indexLoad.reason === "config"
              ? t(locale, "network.tdh.verify.error.config")
              : t(locale, "network.tdh.verify.error.body")}
          </p>
          <VerificationRetry label={t(locale, "network.tdh.verify.retry")} />
        </Notice>
        <VerificationMethod locale={locale} />
      </div>
    );
  }

  const index = indexLoad.index;
  const isSample = indexLoad.source === "sample";
  const cutover = cutoverState(index.cutover, now);
  const afterCutover = cutover.kind === "done";
  const days = sortedIndexDays(index);
  const entry = selected ?? days[0] ?? null;
  if (entry === null) {
    return null;
  }
  const latest = latestIndexDay(index);
  const neighbours = dayNeighbours(index, entry.cycleDay);
  const day = dayLoad?.status === "ok" ? dayLoad.day : null;
  const verdict = day
    ? verdictState(day.verdict, day.differences.length > 0)
    : indexDayVerdict(entry);
  const isLatest = latest?.cycleDay === entry.cycleDay;
  const delta = day
    ? totalDelta(
        day.implementations.rust.totalTdh,
        day.implementations.live?.totalTdh
      )
    : totalDelta(entry.totalTdh.rust, entry.totalTdh.live);
  const missing = missingCycleDays(index);

  return (
    <div className="tw-space-y-6">
      {isSample && <SampleBanner locale={locale} />}
      <VerificationDayPicker
        locale={locale}
        options={days.map((option) => ({
          cycleDay: option.cycleDay,
          label: t(locale, "network.tdh.verify.picker.option", {
            date: formatCycleDate(locale, option.date),
            cycle: formatInteger(locale, option.cycleDay),
          }),
        }))}
        selected={entry.cycleDay}
        previous={neighbours.previous}
        next={neighbours.next}
        latest={neighbours.latest}
      />
      <VerificationStatusBand
        locale={locale}
        cycleDay={entry.cycleDay}
        date={entry.date}
        cutoffBlock={day?.cutoffBlock ?? null}
        verdict={verdict}
        mode={day?.mode ?? null}
        cutover={cutover}
        isLatest={isLatest}
        freshness={
          latest && !isSample ? reportFreshness(latest.cycleDay, now) : null
        }
        latestDate={latest?.date ?? null}
        missingDays={missing.length}
      />
      {(dayLoad?.status === "error" || dayLoad?.status === "not-found") && (
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
      {day ? (
        <>
          <VerificationAgreementTiles
            locale={locale}
            rustVsLive={day.agreement.rustVsLive}
            rustVsPython={day.agreement.rustVsPython}
            pythonRan={day.implementations.python !== null}
            totalDelta={delta}
            afterCutover={afterCutover}
          />
          <VerificationSideBySide
            locale={locale}
            rust={day.implementations.rust}
            python={day.implementations.python}
            live={day.implementations.live}
          />
          <VerificationDifferences
            locale={locale}
            differences={day.differences}
            cycleDay={day.cycleDay}
            totalDelta={delta}
          />
        </>
      ) : (
        <IndexOnlySummary locale={locale} entry={entry} />
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
        isSample={isSample}
        day={day}
        dayUrl={dayLoad?.status === "ok" ? dayLoad.dayUrl : null}
        indexUrl={indexLoad.indexUrl}
      />
      <VerificationCheck
        locale={locale}
        cycleDay={entry.cycleDay}
        cutoffBlock={day?.cutoffBlock ?? null}
        liveSource={
          day?.implementations.live?.sources?.identity ??
          day?.implementations.live?.source ??
          null
        }
      />
      <VerificationMethod locale={locale} />
      <TdhPager current="/network/tdh/verification" locale={locale} />
    </div>
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
      {entry.identitiesEqual !== null && entry.identitiesTotal !== null && (
        <span className="tw-tabular-nums">
          {t(locale, "network.tdh.verify.tiles.identitiesLive")}:{" "}
          {t(locale, "network.tdh.verify.tiles.equalOf", {
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
