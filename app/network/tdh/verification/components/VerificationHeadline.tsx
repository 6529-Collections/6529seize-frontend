import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { VerificationDay } from "@/lib/tdh/verification/schema";
import {
  dayDifferences,
  dayRunNote,
  type DayNeighbours,
  type VerdictState,
} from "@/lib/tdh/verification/states";
import TdhDisclosure from "../../shared/TdhDisclosure";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { TDH_CARD, TDH_FOCUS_RING, TDH_LINK } from "../../shared/tdhStyles";
import { dayRunNoteString, ShaMatch } from "./VerificationProvenanceParts";
import {
  formatCycleDate,
  formatInteger,
  middleTruncate,
} from "./verificationFormat";

export function verificationDayHref(cycleDay: number): string {
  return `/network/tdh/verification/${cycleDay}`;
}

const NAV_BUTTON = `tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-text-iron-200 tw-no-underline hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-iron-50 ${TDH_FOCUS_RING}`;
const NAV_DISABLED =
  "tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-text-iron-700";

/** The day's result in one sentence, from its counts and verdict. */
function headlineSentence(
  locale: SupportedLocale,
  day: VerificationDay,
  verdict: VerdictState
): string {
  const date = formatCycleDate(locale, day.date);
  const live = day.agreement.rustVsLive;
  const python =
    day.implementations.python === null ? null : day.agreement.rustVsPython;
  const values = {
    date,
    identities: formatInteger(locale, live?.identitiesTotal ?? 0),
    wallets: formatInteger(locale, live?.walletsTotal ?? 0),
    equal: formatInteger(locale, live?.identitiesEqual ?? 0),
    total: formatInteger(locale, live?.identitiesTotal ?? 0),
    differ: formatInteger(locale, dayDifferences(day).identities),
  };
  const key = (name: string) =>
    `network.tdh.verify.headline.${name}` as MessageKey;
  switch (verdict) {
    case "equal":
      if (live === null) {
        return t(locale, key("equalNoLive"), {
          ...values,
          identities: formatInteger(locale, python?.identitiesTotal ?? 0),
          wallets: formatInteger(locale, python?.walletsTotal ?? 0),
        });
      }
      return t(
        locale,
        key(python === null ? "equalNoPython" : "equal"),
        values
      );
    case "explained":
      return t(locale, key("explained"), values);
    case "investigating":
      return t(locale, key("investigating"), values);
    case "mismatch":
      return t(locale, key("mismatch"), values);
    case "liveUnavailable":
      return t(locale, key("liveUnavailable"), values);
    case "pending":
    case "unknown":
      return t(locale, key("unknown"), values);
  }
}

/** The verdict as a short headline, above the full sentence. */
function headlineShort(
  locale: SupportedLocale,
  day: VerificationDay,
  verdict: VerdictState
): string {
  const live = day.agreement.rustVsLive;
  const python =
    day.implementations.python === null ? null : day.agreement.rustVsPython;
  const counts = live ?? python;
  const values = {
    identities: formatInteger(locale, counts?.identitiesTotal ?? 0),
    wallets: formatInteger(locale, counts?.walletsTotal ?? 0),
    equal: formatInteger(locale, live?.identitiesEqual ?? 0),
    total: formatInteger(locale, live?.identitiesTotal ?? 0),
  };
  const key = (name: string) =>
    `network.tdh.verify.headline.short.${name}` as MessageKey;
  switch (verdict) {
    case "equal":
      return t(locale, key("equal"), values);
    case "explained":
    case "investigating":
    case "mismatch":
    case "liveUnavailable":
      return t(locale, key(verdict), values);
    case "pending":
    case "unknown":
      return t(locale, key("unknown"), values);
  }
}

function DayArrow({
  locale,
  target,
  direction,
}: {
  readonly locale: SupportedLocale;
  readonly target: number | null;
  readonly direction: "previous" | "next";
}) {
  const Icon = direction === "previous" ? ChevronLeftIcon : ChevronRightIcon;
  const label = t(locale, `network.tdh.verify.picker.${direction}`);
  if (target === null) {
    return (
      <span
        className={NAV_DISABLED}
        aria-disabled="true"
        title={
          direction === "next"
            ? t(locale, "network.tdh.verify.picker.nextNone")
            : label
        }
      >
        <Icon aria-hidden="true" className="tw-size-5" />
        <span className="tw-sr-only">
          {direction === "next"
            ? t(locale, "network.tdh.verify.picker.nextNone")
            : label}
        </span>
      </span>
    );
  }
  return (
    <Link
      href={verificationDayHref(target)}
      className={NAV_BUTTON}
      rel={direction === "previous" ? "prev" : "next"}
      title={label}
    >
      <Icon aria-hidden="true" className="tw-size-5" />
      <span className="tw-sr-only">{label}</span>
    </Link>
  );
}

/**
 * The three totals of the day, the SHA-256 of its file with whether it is the
 * one the feed states, and the file itself: a shared link shows its evidence
 * in the first screen.
 */
function DayEvidence({
  locale,
  day,
  daySha256,
  statedSha256,
  dayUrl,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay;
  readonly daySha256: string | null;
  readonly statedSha256: string | null;
  readonly dayUrl: string | null;
}) {
  const totals = [
    ["rust", day.implementations.rust.totalTdh],
    ["python", day.implementations.python?.totalTdh ?? null],
    ["live", day.implementations.live?.totalTdh ?? null],
  ] as const;
  return (
    <div className="tw-min-w-0 tw-text-sm tw-leading-6 sm:tw-text-right">
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {t(locale, "network.tdh.verify.dayHero.totals", {
          cycle: formatInteger(locale, day.cycleDay),
        })}
      </p>
      <dl className="tw-m-0 tw-mt-1 tw-grid tw-grid-cols-[auto_auto] tw-justify-start tw-gap-x-4 tw-tabular-nums sm:tw-justify-end">
        {totals.map(([key, value]) => (
          <div key={key} className="tw-contents">
            <dt className="tw-text-iron-400">
              {t(locale, `network.tdh.verify.side.${key}`)}
            </dt>
            <dd className="tw-m-0 tw-font-medium tw-text-iron-50">
              {value === null ? "–" : formatInteger(locale, value)}
            </dd>
          </div>
        ))}
      </dl>
      {daySha256 !== null && (
        <p className="tw-m-0 tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-iron-400 sm:tw-justify-end">
          <span>{t(locale, "network.tdh.verify.dayHero.file")}</span>
          <code
            className="tw-font-mono tw-text-xs tw-text-iron-200"
            title={daySha256}
          >
            {middleTruncate(daySha256)}
          </code>
          <TdhCopyButton
            value={daySha256}
            label={t(locale, "network.tdh.shared.copyNamed", {
              name: t(locale, "network.tdh.verify.dayHero.file"),
            })}
            copiedLabel={t(locale, "network.tdh.shared.copied")}
            failedLabel={t(locale, "network.tdh.shared.copyFailed")}
          />
        </p>
      )}
      {(daySha256 !== null && statedSha256 !== null) || dayUrl !== null ? (
        <p className="tw-m-0 tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 sm:tw-justify-end">
          {daySha256 !== null && statedSha256 !== null && (
            <ShaMatch
              locale={locale}
              stated={statedSha256}
              read={daySha256}
              of="read"
            />
          )}
          {dayUrl !== null && (
            <a
              href={dayUrl}
              className={`${TDH_LINK} tw-inline-flex tw-min-h-6 tw-items-center tw-gap-1`}
            >
              <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
              {t(locale, "network.tdh.verify.dayHero.download")}
            </a>
          )}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The top of the dashboard: the verdict and the day's result in one plain
 * sentence, what the day is, and the previous and next day.
 */
export default function VerificationHeadline({
  locale,
  day,
  verdict,
  neighbours,
  isLatest,
  permalink = false,
  daySha256 = null,
  statedSha256 = null,
  dayUrl = null,
  generatedAt = null,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay;
  readonly verdict: VerdictState;
  readonly neighbours: DayNeighbours;
  readonly isLatest: boolean;
  /** A day's own page: its title already names the day and cycle. */
  readonly permalink?: boolean;
  /** The SHA-256 of the day's file as the page read it. */
  readonly daySha256?: string | null;
  /** The SHA-256 the feed's index states for the day's file. */
  readonly statedSha256?: string | null;
  /** The day's file, to download. */
  readonly dayUrl?: string | null;
  /** When the feed wrote the day's file, from the file or the index. */
  readonly generatedAt?: string | null;
}) {
  const cycle = formatInteger(locale, day.cycleDay);
  // "Every record equal" says it all; any other verdict needs its sentence
  // and the job's verdict word.
  const equal =
    verdict === "equal" &&
    day.agreement.rustVsLive !== null &&
    day.implementations.python !== null;
  const runNote = dayRunNote(day.date, generatedAt ?? day.generatedAt);
  return (
    <section
      aria-labelledby="tdh-verify-status-heading"
      className={`${TDH_CARD} tw-p-5 sm:tw-p-6`}
      data-verdict={verdict}
    >
      <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-min-w-0">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-300">
            <TdhStatusPill pill={verdict} locale={locale} />
            {!permalink && (
              <span>
                {t(locale, "network.tdh.verify.headline.day", {
                  date: formatCycleDate(locale, day.date),
                  cycle,
                })}
              </span>
            )}
            {!isLatest && neighbours.latest !== null && (
              // A neutral way to the latest day: an older day is not a
              // problem with its data, so no warning colour.
              <Link
                href="/network/tdh/verification"
                className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-border-primary-400/60 hover:tw-text-primary-300 ${TDH_FOCUS_RING}`}
              >
                {t(locale, "network.tdh.verify.headline.notLatest")}
                <ChevronRightIcon aria-hidden="true" className="tw-size-3.5" />
              </Link>
            )}
          </div>
          <h2
            id="tdh-verify-status-heading"
            className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-balance tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl sm:tw-leading-8"
          >
            {headlineShort(locale, day, verdict)}
          </h2>
          <p className="tw-m-0 tw-mt-2 tw-max-w-[38em] tw-text-base tw-leading-7 tw-text-iron-200">
            {equal
              ? t(locale, "network.tdh.verify.headline.equalBy")
              : headlineSentence(locale, day, verdict)}
          </p>
          {!equal && (
            <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, `network.tdh.verify.verdict.${verdict}` as MessageKey)}
            </p>
          )}
        </div>
        {/* The day's evidence beside the sentence: the three totals and
            the SHA-256 of the file read, so a shared link shows them in
            the first screen. */}
        <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-4 sm:tw-items-end">
          <nav
            aria-label={t(locale, "network.tdh.verify.picker.nav")}
            className="tw-flex tw-items-center tw-gap-2"
          >
            <DayArrow
              locale={locale}
              target={neighbours.previous}
              direction="previous"
            />
            <DayArrow
              locale={locale}
              target={neighbours.next}
              direction="next"
            />
          </nav>
          <DayEvidence
            locale={locale}
            day={day}
            daySha256={daySha256}
            statedSha256={statedSha256}
            dayUrl={dayUrl}
          />
        </div>
      </div>
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
        <div className="tw-min-w-0 tw-space-y-1 tw-text-sm tw-leading-6 tw-text-iron-300">
          <p className="tw-m-0 tw-tabular-nums">
            {t(locale, "network.tdh.verify.status.block", {
              block: formatInteger(locale, day.cutoffBlock),
              date: formatCycleDate(locale, day.date),
            })}
          </p>
          {/* When the file was not written by its scheduled run: a small
              mark here, the sentence in Provenance. */}
          {runNote !== null && (
            <a
              href="#provenance"
              title={
                dayRunNoteString(
                  locale,
                  day.date,
                  generatedAt ?? day.generatedAt
                ) ?? undefined
              }
              className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-amber-400/50 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-amber-100 tw-no-underline hover:tw-border-amber-300 ${TDH_FOCUS_RING}`}
            >
              <span
                aria-hidden="true"
                className="tw-size-1.5 tw-rounded-full tw-bg-amber-400"
              />
              {t(
                locale,
                `network.tdh.verify.provenance.run.pill.${runNote.kind}` as MessageKey
              )}
            </a>
          )}
        </div>
        <div className="tw-min-w-0 lg:tw-max-w-md lg:tw-shrink-0">
          <p className="tw-m-0 tw-flex tw-flex-col tw-items-start tw-gap-1.5 tw-text-sm tw-leading-6 tw-text-iron-300">
            <TdhStatusPill
              pill={day.mode === "checked" ? "checked" : "unchecked"}
              locale={locale}
              size="sm"
            />
            <span>
              {t(
                locale,
                day.mode === "checked"
                  ? "network.tdh.verify.mode.checkedShort"
                  : "network.tdh.verify.mode.uncheckedShort"
              )}
            </span>
          </p>
          <TdhDisclosure
            summary={t(locale, "network.tdh.verify.status.explain")}
          >
            <p className="tw-m-0 tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(
                locale,
                day.mode === "checked"
                  ? "network.tdh.verify.mode.checked"
                  : "network.tdh.verify.mode.unchecked"
              )}
            </p>
          </TdhDisclosure>
        </div>
      </div>
    </section>
  );
}
