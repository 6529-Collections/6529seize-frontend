import {
  ArrowDownTrayIcon,
  ArrowRightIcon,
  BeakerIcon,
  CheckIcon,
  CodeBracketIcon,
  MinusIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { reportsAreLate } from "@/lib/tdh/verification/states";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import {
  formatCycleDate,
  formatShortCycleDate,
} from "./verification/components/verificationFormat";
import { TdhSourcesFootnote } from "./TDHInAMinute";
import TdhStatusPill from "./shared/TdhStatusPill";
import { TDH_FOCUS_RING, TDH_LINK } from "./shared/tdhStyles";
import TDHSection from "./TDHSection";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type DataSummary = Extract<VerificationSummary, { kind: "data" }>;

const POINTS: ReadonlyArray<{
  readonly key: "programs" | "formal" | "daily";
  readonly href: string;
  readonly icon: Icon;
}> = [
  {
    key: "programs",
    href: "/network/tdh/implementations",
    icon: CodeBracketIcon,
  },
  { key: "formal", href: "/network/tdh/formal", icon: ScaleIcon },
  { key: "daily", href: "/network/tdh/verification", icon: BeakerIcon },
];
/** What the checks caught, oldest first (plan §5.2, "found by the checks"). */
const FOUND = ["floors", "netting", "lean", "difftest"] as const;
const SOURCES = ["P26 §13", "D125", "D131", "D132"] as const;

function differenceSentence(
  locale: SupportedLocale,
  summary: DataSummary
): string {
  const count = formatInteger(locale, summary.differenceCount);
  const plural =
    selectPluralCategory(locale, summary.differenceCount) === "one"
      ? "one"
      : "other";
  switch (summary.sentence) {
    case "none":
      return t(locale, "network.tdh.explainer.verified.none");
    case "explained":
    case "investigating":
      return t(
        locale,
        `network.tdh.explainer.verified.${summary.sentence}.${plural}` as MessageKey,
        { count }
      );
    case "mismatch":
    case "liveUnavailable":
    case "pending":
    case "unknown":
      return t(
        locale,
        `network.tdh.explainer.verified.${summary.sentence}` as MessageKey
      );
  }
}

/** Whether the latest day agreed everywhere: every record and the totals. */
function allAgreed(summary: DataSummary): boolean {
  return (
    summary.sentence === "none" &&
    summary.totalsEqual === true &&
    summary.equal !== null &&
    summary.equal === summary.total
  );
}

/** One figure of the proof panel: a large number and what it counts. */
function Figure({
  value,
  label,
  wide = false,
}: {
  readonly value: string;
  readonly label: string;
  /** The total: a row of its own, in the largest type. */
  readonly wide?: boolean;
}) {
  return (
    <div className={`tw-min-w-0 ${wide ? "sm:tw-col-span-2" : ""}`}>
      <p
        className={`tw-m-0 tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50 ${wide ? "tw-text-xl min-[360px]:tw-text-3xl sm:tw-text-4xl" : "tw-text-xl sm:tw-text-2xl"}`}
      >
        {value}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-300">
        {label}
      </p>
    </div>
  );
}

/**
 * Every published day as a labelled chip, oldest first: a tick where every
 * record agreed. The run history of the first days is the dashboard's to
 * tell; here the record stands alone.
 */
function Streak({
  locale,
  summary,
}: {
  readonly locale: SupportedLocale;
  readonly summary: DataSummary;
}) {
  const { record } = summary;
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4">
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-tabular-nums tw-leading-6 tw-text-iron-100">
        {t(locale, "network.tdh.explainer.verified.record", {
          allEqual: formatInteger(locale, record.allEqual),
          days: formatInteger(locale, record.days),
        })}
      </p>
      <ol
        className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-1.5 tw-p-0"
        aria-label={t(locale, "network.tdh.explainer.verified.streakLabel")}
      >
        {record.results.map((day) => (
          <li
            key={day.date}
            className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-sm tw-tabular-nums ${
              day.equal
                ? "tw-border-success/40 tw-bg-success/10 tw-text-iron-100"
                : "tw-border-amber-400/60 tw-text-iron-100"
            }`}
          >
            {day.equal ? (
              <CheckIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-shrink-0 tw-text-success"
              />
            ) : (
              <MinusIcon
                aria-hidden="true"
                className="tw-size-3.5 tw-shrink-0 tw-text-amber-300"
              />
            )}
            <span aria-hidden="true">
              {formatShortCycleDate(locale, day.date)}
            </span>
            <span className="tw-sr-only">
              {t(
                locale,
                day.equal
                  ? "network.tdh.explainer.verified.dayEqual"
                  : "network.tdh.explainer.verified.dayOther",
                { date: formatCycleDate(locale, day.date) }
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The proof moment: the latest day's agreed total and record counts, and the
 * track record as a streak, rendered from the feed; then the day's one
 * caveat with its meaning, and the way into the dashboard.
 */
function ProofPanel({
  locale,
  summary,
}: {
  readonly locale: SupportedLocale;
  readonly summary: DataSummary;
}) {
  const agreed = allAgreed(summary);
  const date = formatCycleDate(locale, summary.date);
  return (
    <div
      className="tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-success/25 tw-bg-success/[0.04] tw-p-4 sm:tw-p-5"
      data-tdh-proof=""
    >
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "network.tdh.explainer.verified.latest", { date })}
      </p>
      {agreed ? (
        <>
          <div className="tw-mt-3 tw-grid tw-gap-x-6 tw-gap-y-4 sm:tw-grid-cols-2">
            <Figure
              wide
              value={formatInteger(locale, summary.rustTotal)}
              label={t(locale, "network.tdh.explainer.verified.totalLabel")}
            />
            <Figure
              value={t(locale, "network.tdh.explainer.verified.ofValue", {
                equal: formatInteger(locale, summary.equal ?? 0),
                total: formatInteger(locale, summary.total ?? 0),
              })}
              label={t(locale, "network.tdh.explainer.verified.identities")}
            />
            {summary.walletsTotal !== null && (
              <Figure
                value={t(locale, "network.tdh.explainer.verified.ofValue", {
                  equal: formatInteger(locale, summary.walletsEqual ?? 0),
                  total: formatInteger(locale, summary.walletsTotal),
                })}
                label={t(locale, "network.tdh.explainer.verified.wallets")}
              />
            )}
          </div>
          <p className="tw-m-0 tw-mt-3 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.explainer.verified.how")}
          </p>
        </>
      ) : (
        <p className="tw-m-0 tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-100">
          <TdhStatusPill pill={summary.verdict} locale={locale} size="sm" />
          <span>
            {t(
              locale,
              summary.afterCutover
                ? "network.tdh.explainer.verified.latestOtherAfter"
                : "network.tdh.explainer.verified.latestOther",
              {
                date,
                equal: formatInteger(locale, summary.equal ?? 0),
                total: formatInteger(locale, summary.total ?? 0),
              }
            )}{" "}
            {differenceSentence(locale, summary)}
          </span>
        </p>
      )}
      <div className="tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4">
        <Streak locale={locale} summary={summary} />
      </div>
      {summary.historyChecked === false && (
        <p className="tw-m-0 tw-mt-3 tw-flex tw-flex-col tw-items-start tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-flex-row sm:tw-items-baseline">
          <Link
            href={`/network/tdh/verification/${summary.cycleDay}#provenance`}
            className={`tw-shrink-0 tw-rounded-full tw-no-underline ${TDH_FOCUS_RING}`}
            title={t(locale, "network.tdh.explainer.verified.uncheckedLink")}
          >
            <TdhStatusPill pill="unchecked" locale={locale} size="sm" />
            <span className="tw-sr-only">
              {t(locale, "network.tdh.explainer.verified.uncheckedLink")}
            </span>
          </Link>
          <span className="tw-max-w-[36em]">
            {t(locale, "network.tdh.explainer.verified.uncheckedMeans")}
          </span>
        </p>
      )}
      <p className="tw-m-0 tw-mt-3 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.explainer.verified.yours")}{" "}
        <a href="#tdh-profile" className={TDH_LINK}>
          {t(locale, "network.tdh.explainer.verified.yoursExplain")}
        </a>
        {t(locale, "network.tdh.explainer.verified.yoursOr")}
        <Link
          href={`/network/tdh/verification/${summary.cycleDay}#side`}
          className={TDH_LINK}
        >
          {t(locale, "network.tdh.explainer.verified.yoursFiles")}
        </Link>
        {t(locale, "network.tdh.explainer.verified.yoursEnd")}
      </p>
      <Link
        href="/network/tdh/verification"
        className={`tw-group tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline hover:tw-text-primary-400 ${TDH_FOCUS_RING}`}
      >
        {t(locale, "network.tdh.explainer.verified.link")}
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
        />
      </Link>
    </div>
  );
}

/** What the checks caught before launch, each with its date. */
function FoundByChecks({
  locale,
  manifestUrl,
}: {
  readonly locale: SupportedLocale;
  readonly manifestUrl: string | null;
}) {
  return (
    <div className="tw-mt-6">
      <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "network.tdh.explainer.found.title")}
      </h3>
      <ul className="tw-m-0 tw-mt-3 tw-max-w-[38em] tw-list-none tw-space-y-3 tw-p-0">
        {FOUND.map((key) => (
          <li
            key={key}
            className="tw-grid tw-grid-cols-[5.5rem_minmax(0,1fr)] tw-gap-3 tw-text-sm tw-leading-6 sm:tw-grid-cols-[6.5rem_minmax(0,1fr)]"
          >
            <span className="tw-font-medium tw-tabular-nums tw-text-iron-400">
              {t(locale, `network.tdh.explainer.found.${key}.date`)}
            </span>
            <span className="tw-text-iron-200">
              {t(locale, `network.tdh.explainer.found.${key}.body`)}
            </span>
          </li>
        ))}
      </ul>
      {manifestUrl !== null && (
        <a
          href={manifestUrl}
          className={`${TDH_LINK} tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-sm`}
        >
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "network.tdh.explainer.found.manifest")}
        </a>
      )}
    </div>
  );
}

/**
 * The overview's "Checked daily, in public" section (plan §5.2): the proof
 * panel with the latest day and the track record, the three reasons to trust
 * the number, each with a link, and what the checks caught. The panel is
 * left out when the data could not be loaded, so the overview never fails on
 * the dashboard's account.
 */
export default function TDHVerifiedDaily({
  locale,
  summary,
  manifestUrl = null,
  now = new Date(),
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary | null;
  /** The Lean proof manifest published with the daily feed, if any. */
  readonly manifestUrl?: string | null;
  readonly now?: Date;
}) {
  return (
    <TDHSection
      id="tdh-verified"
      title={t(locale, "network.tdh.explainer.verified.title")}
    >
      <p className="tw-m-0 tw-max-w-[36em] tw-text-base tw-leading-7 tw-text-iron-200">
        {t(locale, "network.tdh.explainer.verified.body")}
      </p>
      {summary?.kind === "data" && (
        <ProofPanel locale={locale} summary={summary} />
      )}
      {summary?.kind === "awaiting" && (
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-200">
          {t(
            locale,
            reportsAreLate(now)
              ? "network.tdh.explainer.verified.awaitingLate"
              : "network.tdh.explainer.verified.awaiting"
          )}
        </p>
      )}
      <ul className="tw-m-0 tw-mt-5 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-0">
        {POINTS.map(({ key, href, icon: PointIcon }) => (
          <li key={key}>
            <Link
              href={href}
              className={`tw-group tw-grid tw-grid-cols-[1.25rem_minmax(0,1fr)_1rem] tw-items-start tw-gap-x-3 tw-gap-y-1 tw-px-4 tw-py-4 tw-no-underline tw-transition-colors hover:tw-bg-iron-800/60 motion-reduce:tw-transition-none md:tw-grid-cols-[1.25rem_11rem_minmax(0,1fr)_1rem] md:tw-gap-x-4 ${TDH_FOCUS_RING}`}
            >
              <PointIcon
                aria-hidden="true"
                className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
              />
              <span className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
                {t(locale, `network.tdh.explainer.verified.point.${key}.title`)}
              </span>
              <span className="tw-col-start-2 tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-300 md:tw-col-start-3 md:tw-row-start-1">
                {t(locale, `network.tdh.explainer.verified.point.${key}.body`)}
              </span>
              <ArrowRightIcon
                aria-hidden="true"
                className="tw-col-start-3 tw-row-start-1 tw-mt-1 tw-size-4 tw-text-primary-300 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none md:tw-col-start-4"
              />
            </Link>
          </li>
        ))}
      </ul>
      <FoundByChecks locale={locale} manifestUrl={manifestUrl} />
      <TdhSourcesFootnote locale={locale} refs={SOURCES} legend={false} />
    </TDHSection>
  );
}
