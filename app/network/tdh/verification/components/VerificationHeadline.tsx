import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { VerificationDay } from "@/lib/tdh/verification/schema";
import {
  dayDifferences,
  type DayNeighbours,
  type VerdictState,
} from "@/lib/tdh/verification/states";
import TdhDisclosure from "../../shared/TdhDisclosure";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import { TDH_CARD, TDH_FOCUS_RING } from "../../shared/tdhStyles";
import { formatCycleDate, formatInteger } from "./verificationFormat";

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
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay;
  readonly verdict: VerdictState;
  readonly neighbours: DayNeighbours;
  readonly isLatest: boolean;
  /** A day's own page: its title already names the day and cycle. */
  readonly permalink?: boolean;
}) {
  const cycle = formatInteger(locale, day.cycleDay);
  return (
    <section
      aria-labelledby="tdh-verify-status-heading"
      className={`${TDH_CARD} tw-p-5 sm:tw-p-6`}
      data-verdict={verdict}
    >
      <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-min-w-0">
          <h2
            id="tdh-verify-status-heading"
            className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-300"
          >
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
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-balance tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl sm:tw-leading-8">
            {headlineShort(locale, day, verdict)}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-200">
            {headlineSentence(locale, day, verdict)}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, `network.tdh.verify.verdict.${verdict}` as MessageKey)}
          </p>
        </div>
        <nav
          aria-label={t(locale, "network.tdh.verify.picker.nav")}
          className="tw-flex tw-shrink-0 tw-items-center tw-gap-2"
        >
          <DayArrow
            locale={locale}
            target={neighbours.previous}
            direction="previous"
          />
          <DayArrow locale={locale} target={neighbours.next} direction="next" />
        </nav>
      </div>
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
        <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdh.verify.status.block", {
            block: formatInteger(locale, day.cutoffBlock),
            date: formatCycleDate(locale, day.date),
          })}
          <TdhSource refs={["P26 §4.2"]} locale={locale} />
        </p>
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
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(
                locale,
                day.mode === "checked"
                  ? "network.tdh.verify.mode.checked"
                  : "network.tdh.verify.mode.unchecked"
              )}
              <TdhSource refs={["D118", "P53 §11"]} locale={locale} />
            </p>
          </TdhDisclosure>
        </div>
      </div>
    </section>
  );
}
