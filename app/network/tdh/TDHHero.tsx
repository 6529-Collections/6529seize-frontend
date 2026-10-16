import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationSummary } from "@/lib/tdh/verification/summary.server";
import { MINUTE_EXAMPLE } from "./how-it-works/examples";
import { TDH_FOCUS_RING, TDH_H1, TDH_LEDE } from "./shared/tdhStyles";
import TdhStatusPill from "./shared/TdhStatusPill";
import { formatShortCycleDate } from "./verification/components/verificationFormat";

const TERMS = [
  { key: "days", value: "days" },
  { key: "rate", value: "rate" },
  { key: "boost", value: "boost" },
  { key: "tdh", value: "final" },
] as const;

const cents = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Days × Rate × Boost = TDH, the whole rule in one line, with the worked
 * example's numbers in it. On phones it reads as a sum down the page; from
 * `sm` as one line of four equal tiles.
 */
function FormulaStrip({ locale }: { readonly locale: SupportedLocale }) {
  const values = {
    days: formatInteger(locale, MINUTE_EXAMPLE.days),
    rate: cents(locale, MINUTE_EXAMPLE.rateCents),
    boost: cents(locale, MINUTE_EXAMPLE.betaCents),
    final: formatInteger(locale, MINUTE_EXAMPLE.final),
  };
  const operator = (index: number): string => {
    if (index === 0) {
      return "";
    }
    return index === TERMS.length - 1 ? "=" : "×";
  };
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3">
        <span className="tw-block tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
          {t(locale, "network.tdh.explainer.formula.label")}
        </span>
        <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdh.explainer.formula.example")}
        </span>
      </figcaption>
      <p className="tw-sr-only">
        {t(locale, "network.tdh.explainer.formula.text")}
      </p>
      <ol
        aria-hidden="true"
        className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-0 sm:tw-hidden lg:tw-block xl:tw-hidden"
      >
        {TERMS.map((term, index) => (
          <li
            key={term.key}
            className={`tw-grid tw-grid-cols-[1.5rem_minmax(0,1fr)_auto] tw-items-baseline tw-gap-2 tw-px-4 tw-py-3 ${index === TERMS.length - 1 ? "tw-bg-primary-500/[0.08]" : ""}`}
          >
            <span className="tw-text-lg tw-font-light tw-text-iron-400">
              {operator(index)}
            </span>
            <span className="tw-min-w-0">
              <span className="tw-block tw-text-base tw-font-semibold tw-text-iron-50">
                {t(locale, `network.tdh.explainer.formula.${term.key}`)}
              </span>
              <span className="tw-block tw-text-sm tw-text-iron-400">
                {t(locale, `network.tdh.explainer.formula.${term.key}Note`)}
              </span>
            </span>
            <span className="tw-text-xl tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {values[term.value]}
            </span>
          </li>
        ))}
      </ol>
      <div
        aria-hidden="true"
        className="tw-hidden tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.15fr)] tw-items-stretch tw-gap-2 sm:tw-grid lg:tw-hidden xl:tw-grid"
      >
        {TERMS.map((term, index) => (
          <div key={term.key} className="tw-contents">
            {index > 0 && (
              <span className="tw-flex tw-items-center tw-justify-center tw-text-2xl tw-font-light tw-text-iron-400">
                {operator(index)}
              </span>
            )}
            <div
              className={`tw-grid tw-min-w-0 tw-grid-rows-[auto_auto_1fr] tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-3 tw-text-center ${index === TERMS.length - 1 ? "tw-border-primary-400/40 tw-bg-primary-500/[0.08]" : "tw-border-white/[0.07] tw-bg-iron-900"}`}
            >
              <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(locale, `network.tdh.explainer.formula.${term.key}`)}
              </span>
              <span className="tw-block tw-whitespace-nowrap tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50">
                {values[term.value]}
              </span>
              <span className="tw-block tw-self-start tw-text-balance tw-text-sm tw-leading-5 tw-text-iron-400">
                {t(locale, `network.tdh.explainer.formula.${term.key}Note`)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.explainer.formula.sum")}
      </p>
    </figure>
  );
}

function stripSentence(
  locale: SupportedLocale,
  summary: VerificationSummary
): string {
  if (summary.kind === "awaiting") {
    return t(locale, "network.tdh.explainer.strip.awaiting");
  }
  const date = formatShortCycleDate(locale, summary.date);
  if (
    summary.sentence === "none" &&
    summary.totalsEqual === true &&
    summary.equal !== null &&
    summary.equal === summary.total &&
    summary.walletsTotal !== null &&
    summary.walletsEqual === summary.walletsTotal
  ) {
    return t(locale, "network.tdh.explainer.strip.equal", {
      date,
      identities: formatInteger(locale, summary.total),
      wallets: formatInteger(locale, summary.walletsTotal),
    });
  }
  return t(locale, "network.tdh.explainer.strip.other", {
    date,
    equal: formatInteger(locale, summary.equal ?? 0),
    total: formatInteger(locale, summary.total ?? 0),
  });
}

/**
 * The latest daily result near the top of the overview, in one line: the
 * track record in bold, the latest day's agreement, its limit as a pill
 * (history not yet fully checked), and the way into the dashboard. The
 * section "Checked daily, in public" below carries the detail.
 */
function VerifiedStrip({
  locale,
  summary,
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary;
}) {
  const awaiting = summary.kind === "awaiting";
  const Icon = awaiting ? ClockIcon : CheckBadgeIcon;
  return (
    <Link
      href="/network/tdh/verification"
      className={`tw-group tw-mt-8 tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-success/30 tw-bg-success/[0.05] tw-px-4 tw-py-3 tw-no-underline tw-transition-colors hover:tw-border-success/60 motion-reduce:tw-transition-none md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-6 md:tw-px-5 ${TDH_FOCUS_RING}`}
    >
      <span className="tw-flex tw-min-w-0 tw-items-start tw-gap-3">
        <Icon
          aria-hidden="true"
          className={`tw-mt-0.5 tw-size-5 tw-shrink-0 ${awaiting ? "tw-text-iron-300" : "tw-text-success"}`}
        />
        <span className="tw-min-w-0 tw-text-sm tw-leading-6 tw-text-iron-200 sm:tw-text-[15px]">
          {!awaiting && (
            <strong className="tw-font-semibold tw-text-iron-50">
              {t(locale, "network.tdh.explainer.strip.record", {
                allEqual: formatInteger(locale, summary.record.allEqual),
                days: formatInteger(locale, summary.record.days),
              })}
            </strong>
          )}{" "}
          {stripSentence(locale, summary)}
          {!awaiting && summary.historyChecked === false && (
            <span className="tw-ml-2 tw-inline-flex tw-align-middle">
              <TdhStatusPill pill="unchecked" locale={locale} size="sm" />
            </span>
          )}
        </span>
      </span>
      <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-pl-8 tw-text-sm tw-font-medium tw-text-primary-300 md:tw-pl-0">
        {t(locale, "network.tdh.explainer.strip.link")}
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
        />
      </span>
    </Link>
  );
}

/** The overview's header: what TDH is, the formula, and today's check. */
export default function TDHHero({
  locale,
  verification,
}: {
  readonly locale: SupportedLocale;
  readonly verification: VerificationSummary | null;
}) {
  return (
    <header className="tw-pb-10 tw-pt-2 sm:tw-pb-12 sm:tw-pt-10">
      <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:tw-items-center lg:tw-gap-12">
        <div>
          {/* On phones the section tabs above already say where you are,
              so the H1 starts the page. */}
          <p className="tw-m-0 tw-mb-3 tw-hidden tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300 md:tw-block">
            {t(locale, "network.tdh.explainer.title")}
          </p>
          <h1 className={TDH_H1}>
            {t(locale, "network.tdh.explainer.promise")}
          </h1>
          <p className={`tw-mb-0 tw-mt-5 tw-max-w-[36em] ${TDH_LEDE}`}>
            {t(locale, "network.tdh.explainer.intro")}
          </p>
        </div>
        <FormulaStrip locale={locale} />
      </div>
      {verification !== null && (
        <VerifiedStrip locale={locale} summary={verification} />
      )}
    </header>
  );
}
